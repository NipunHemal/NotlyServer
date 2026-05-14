package lk.hemal.notly.service.impl;

import lk.hemal.notly.dto.response.BinItemResponse;
import lk.hemal.notly.dto.response.RestoreResultResponse;
import lk.hemal.notly.entity.*;
import lk.hemal.notly.exception.ErrorCode;
import lk.hemal.notly.exception.NotlyException;
import lk.hemal.notly.repo.*;
import lk.hemal.notly.service.ActivityLogService;
import lk.hemal.notly.service.BinService;
import lk.hemal.notly.service.WorkspaceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BinServiceImpl implements BinService {

    private final BinItemRepo binItemRepo;
    private final NoteRepo noteRepo;
    private final GroupRepo groupRepo;
    private final WorkspaceRepo workspaceRepo;
    private final CollaboratorRepo collaboratorRepo;
    private final ReminderRepo reminderRepo;
    private final NoteTagRepo noteTagRepo;
    private final NoteMediaRepo noteMediaRepo;
    private final ActivityLogRepo activityLogRepo;
    private final GroupCollaboratorRepo groupCollaboratorRepo;
    private final WorkspaceService workspaceService;
    private final ActivityLogService activityLogService;

    @Override
    @Transactional(readOnly = true)
    public List<BinItemResponse> getBinItems(User user) {
        List<BinItem> items = binItemRepo.findByOwnerIdOrderByDeletedAtDesc(user.getId());

        return items.stream()
                .map(item -> {
                    String title = "";
                    UUID originalGroupId = null;

                    if (item.getEntityType() == BinItem.EntityType.NOTE) {
                        Note note = noteRepo.findRawById(item.getEntityId()).orElse(null);
                        if (note != null) {
                            title = note.getTitle();
                            originalGroupId = note.getGroup() != null ? note.getGroup().getId() : null;
                        }
                    } else if (item.getEntityType() == BinItem.EntityType.GROUP) {
                        Group group = groupRepo.findRawById(item.getEntityId()).orElse(null);
                        if (group != null) {
                            title = group.getName();
                        }
                    }

                    long daysLeft = Math.max(0, Duration.between(LocalDateTime.now(), item.getRestoreDeadline()).toDays());

                    return new BinItemResponse(
                            item.getId(),
                            item.getEntityType().name(),
                            item.getEntityId(),
                            title,
                            item.getDeletedAt(),
                            item.getRestoreDeadline(),
                            daysLeft,
                            originalGroupId
                    );
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public RestoreResultResponse restoreBinItem(UUID binItemId, User user) {
        BinItem binItem = binItemRepo.findById(binItemId)
                .filter(item -> item.getOwner().getId().equals(user.getId()))
                .orElseThrow(() -> new NotlyException(ErrorCode.BIN_ITEM_NOT_FOUND));

        if (binItem.getRestoreDeadline().isBefore(LocalDateTime.now())) {
            throw new NotlyException(ErrorCode.BIN_RESTORE_EXPIRED);
        }

        if (binItem.getEntityType() == BinItem.EntityType.NOTE) {
            restoreNote(binItem, user);
            binItemRepo.delete(binItem);
            return new RestoreResultResponse(true, "NOTE", binItem.getEntityId());
        } else if (binItem.getEntityType() == BinItem.EntityType.GROUP) {
            restoreGroup(binItem, user);
            binItemRepo.delete(binItem);
            return new RestoreResultResponse(true, "GROUP", binItem.getEntityId());
        }

        throw new NotlyException(ErrorCode.BAD_REQUEST, "Unknown entity type");
    }

    @Override
    @Transactional
    public void permanentDeleteBinItem(UUID binItemId, User user) {
        BinItem binItem = binItemRepo.findById(binItemId)
                .filter(item -> item.getOwner().getId().equals(user.getId()))
                .orElseThrow(() -> new NotlyException(ErrorCode.BIN_ITEM_NOT_FOUND));

        if (binItem.getEntityType() == BinItem.EntityType.NOTE) {
            permanentDeleteNote(binItem.getEntityId());
        } else if (binItem.getEntityType() == BinItem.EntityType.GROUP) {
            permanentDeleteGroupSubtree(binItem.getEntityId());
        }

        binItemRepo.delete(binItem);
        log.info("[BIN] Permanently deleted {} id={}", binItem.getEntityType(), binItem.getEntityId());
    }

    @Override
    @Transactional
    public void emptyBin(User user) {
        List<BinItem> items = binItemRepo.findByOwnerIdOrderByDeletedAtDesc(user.getId());
        for (BinItem item : items) {
            if (item.getEntityType() == BinItem.EntityType.NOTE) {
                permanentDeleteNote(item.getEntityId());
            } else if (item.getEntityType() == BinItem.EntityType.GROUP) {
                permanentDeleteGroupSubtree(item.getEntityId());
            }
        }
        binItemRepo.deleteAll(items);
        log.info("[BIN] Emptied bin for user id={}", user.getId());
    }

    // ── Private Helpers ────────────────────────────────────────

    private void restoreNote(BinItem binItem, User user) {
        noteRepo.restoreRaw(binItem.getEntityId());

        Note note = noteRepo.findRawById(binItem.getEntityId()).orElse(null);
        if (note != null && note.getGroup() != null) {
            Group group = groupRepo.findById(note.getGroup().getId()).orElse(null);
            if (group == null || group.getDeletedAt() != null) {
                Workspace workspace = workspaceService.getOrCreateDefaultWorkspace(user);
                Group rootGroup = groupRepo.findByWorkspaceIdAndParentIsNullOrderBySortOrderAsc(workspace.getId())
                        .stream().findFirst().orElse(null);
                if (rootGroup != null) {
                    noteRepo.save(note);
                }
            }
        }

        activityLogService.log(user.getId(), ActivityLog.EntityType.NOTE,
                binItem.getEntityId(), ActivityLog.ActivityAction.RESTORED, null);
    }

    private void restoreGroup(BinItem binItem, User user) {
        groupRepo.restoreRaw(binItem.getEntityId());

        Group rootGroup = groupRepo.findRawById(binItem.getEntityId()).orElse(null);
        if (rootGroup != null) {
            restoreGroupSubtreeRecursive(rootGroup, user);

            if (rootGroup.getParent() != null) {
                Group parent = groupRepo.findById(rootGroup.getParent().getId()).orElse(null);
                if (parent == null || parent.getDeletedAt() != null) {
                    Workspace workspace = workspaceService.getOrCreateDefaultWorkspace(user);
                    Group newRoot = groupRepo.findByWorkspaceIdAndParentIsNullOrderBySortOrderAsc(workspace.getId())
                            .stream().findFirst().orElse(null);
                    if (newRoot != null) {
                        rootGroup.setParent(newRoot);
                        groupRepo.save(rootGroup);
                    }
                }
            }
        }

        activityLogService.log(user.getId(), ActivityLog.EntityType.GROUP,
                binItem.getEntityId(), ActivityLog.ActivityAction.RESTORED, null);
    }

    private void restoreGroupSubtreeRecursive(Group group, User user) {
        List<Group> children = groupRepo.findByParentIdOrderBySortOrderAsc(group.getId());
        for (Group child : children) {
            groupRepo.restoreRaw(child.getId());
            restoreGroupSubtreeRecursive(child, user);
        }

        List<Note> notes = noteRepo.findDeletedByOwner(user.getId());
        for (Note note : notes) {
            if (note.getGroup() != null && note.getGroup().getId().equals(group.getId())) {
                noteRepo.restoreRaw(note.getId());
            }
        }
    }

    private void permanentDeleteNote(UUID noteId) {
        collaboratorRepo.deleteByNoteId(noteId);
        reminderRepo.deleteByNoteId(noteId);
        noteTagRepo.deleteByNoteId(noteId);
        noteMediaRepo.deleteByNoteId(noteId);
        activityLogRepo.deleteByEntityTypeAndEntityId(ActivityLog.EntityType.NOTE, noteId);
        noteRepo.hardDelete(noteId);
    }

    private void permanentDeleteGroupSubtree(UUID groupId) {
        List<Group> children = groupRepo.findByParentIdOrderBySortOrderAsc(groupId);
        for (Group child : children) {
            permanentDeleteGroupSubtree(child.getId());
        }

        List<Note> notes = noteRepo.findByGroupIdOrderBySortOrderAscCreatedAtAsc(groupId);
        for (Note note : notes) {
            permanentDeleteNote(note.getId());
        }

        groupCollaboratorRepo.deleteByGroupId(groupId);
        activityLogRepo.deleteByEntityTypeAndEntityId(ActivityLog.EntityType.GROUP, groupId);
        groupRepo.hardDelete(groupId);
    }
}
