package lk.hemal.notly.service.impl;

import lk.hemal.notly.dto.request.ChangeLockRequest;
import lk.hemal.notly.dto.request.CopyNoteRequest;
import lk.hemal.notly.dto.request.CreateNoteRequest;
import lk.hemal.notly.dto.request.LockRequest;
import lk.hemal.notly.dto.request.MoveNoteRequest;
import lk.hemal.notly.dto.request.UnlockRequest;
import lk.hemal.notly.dto.request.UpdateNoteRequest;
import lk.hemal.notly.dto.response.NoteResponse;
import lk.hemal.notly.dto.response.NoteSummaryResponse;
import lk.hemal.notly.dto.response.PublicGroupResponse;
import lk.hemal.notly.dto.response.PublicNoteResponse;
import lk.hemal.notly.dto.response.ShareLinkResponse;
import lk.hemal.notly.dto.response.UnlockTokenResponse;
import lk.hemal.notly.entity.BinItem;
import lk.hemal.notly.entity.Group;
import lk.hemal.notly.entity.Note;
import lk.hemal.notly.entity.User;
import lk.hemal.notly.exception.ErrorCode;
import lk.hemal.notly.exception.NotlyException;
import lk.hemal.notly.mapper.NoteMapper;
import lk.hemal.notly.repo.BinItemRepo;
import lk.hemal.notly.repo.GroupRepo;
import lk.hemal.notly.repo.NoteRepo;
import lk.hemal.notly.service.ActivityLogService;
import lk.hemal.notly.service.LockAttemptService;
import lk.hemal.notly.service.NoteService;
import lk.hemal.notly.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NoteServiceImpl implements NoteService {

    private final NoteRepo noteRepo;
    private final GroupRepo groupRepo;
    private final BinItemRepo binItemRepo;
    private final NoteMapper noteMapper;
    private final JwtUtil jwtUtil;
    private final ActivityLogService activityLogService;
    private final LockAttemptService lockAttemptService;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public NoteResponse createNote(CreateNoteRequest req, User user) {
        Group group = groupRepo.findByIdAndWorkspaceOwnerId(req.getGroupId(), user.getId())
                .orElseThrow(() -> new NotlyException(ErrorCode.GROUP_NOT_FOUND,
                        "Group " + req.getGroupId() + " not found"));

        if (group.isLocked() || group.isSecure()) {
            throw new NotlyException(ErrorCode.ITEM_LOCKED, "Cannot create note in a locked/secure group. Unlock it first.");
        }

        Note note = new Note();
        note.setGroup(group);
        note.setOwner(user);
        note.setTitle(req.getTitle() != null && !req.getTitle().isBlank() ? req.getTitle() : "Untitled");
        note.setContent(req.getContent() != null ? req.getContent() : "");
        note.setStatus(Note.NoteStatus.ACTIVE);
        note.setVisibility(Note.Visibility.PRIVATE);
        note.setSortOrder(noteRepo.maxSortOrderInGroup(req.getGroupId()) + 1);

        note = noteRepo.save(note);

        activityLogService.log(user.getId(), lk.hemal.notly.entity.ActivityLog.EntityType.NOTE,
                note.getId(), lk.hemal.notly.entity.ActivityLog.ActivityAction.CREATED,
                Map.of("title", note.getTitle(), "group_id", group.getId()));

        log.info("[NOTE] Created id={} title={} user={}", note.getId(), note.getTitle(), user.getId());
        return noteMapper.toResponse(note);
    }

    @Override
    @Transactional(readOnly = true)
    public NoteResponse getNoteById(UUID noteId, User user, String unlockToken) {
        Note note = requireOwnedNote(noteId, user);

        if (note.isLocked() || isGroupOrAncestorLocked(note.getGroup(), unlockToken, user)) {
            if (unlockToken == null || !isUnlockTokenValidForNote(unlockToken, note, user)) {
                throw new NotlyException(ErrorCode.ITEM_LOCKED, "This note is locked. Provide a valid unlock token.");
            }
        }

        activityLogService.log(user.getId(), lk.hemal.notly.entity.ActivityLog.EntityType.NOTE,
                note.getId(), lk.hemal.notly.entity.ActivityLog.ActivityAction.VIEWED, null);

        return noteMapper.toResponse(note);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NoteSummaryResponse> getNotesByGroupId(UUID groupId, User user) {
        Group group = groupRepo.findByIdAndWorkspaceOwnerId(groupId, user.getId())
                .orElseThrow(() -> new NotlyException(ErrorCode.GROUP_NOT_FOUND,
                        "Group " + groupId + " not found"));

        return noteRepo.findByGroupIdOrderBySortOrderAscCreatedAtAsc(groupId).stream()
                .filter(n -> n.getStatus() == Note.NoteStatus.ACTIVE)
                .map(noteMapper::toSummaryResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<NoteSummaryResponse> getNotesByStatus(User user, Note.NoteStatus status) {
        return noteRepo.findByOwnerIdAndStatus(user.getId(), status).stream()
                .map(noteMapper::toSummaryResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<NoteSummaryResponse> getNotesByFavorite(User user) {
        return noteRepo.findByOwnerIdAndStatus(user.getId(), Note.NoteStatus.ACTIVE).stream()
                .filter(Note::isFavorite)
                .map(noteMapper::toSummaryResponse)
                .toList();
    }

    @Override
    @Transactional
    public NoteResponse updateNote(UUID noteId, UpdateNoteRequest req, User user) {
        Note note = requireOwnedNote(noteId, user);

        if (note.isLocked() || isGroupOrAncestorLocked(note.getGroup(), null, user)) {
            throw new NotlyException(ErrorCode.ITEM_LOCKED, "This note is locked. Unlock it first.");
        }

        if (req.getTitle() == null && req.getContent() == null) {
            throw new NotlyException(ErrorCode.BAD_REQUEST, "At least one field (title or content) must be provided");
        }

        if (req.getTitle() != null) {
            note.setTitle(req.getTitle());
        }
        if (req.getContent() != null) {
            note.setContent(req.getContent());
        }

        note = noteRepo.save(note);

        activityLogService.log(user.getId(), lk.hemal.notly.entity.ActivityLog.EntityType.NOTE,
                note.getId(), lk.hemal.notly.entity.ActivityLog.ActivityAction.UPDATED,
                Map.of("title", note.getTitle()));

        log.info("[NOTE] Updated id={} title={}", note.getId(), note.getTitle());
        return noteMapper.toResponse(note);
    }

    @Override
    @Transactional
    public NoteResponse moveNote(UUID noteId, MoveNoteRequest req, User user) {
        Note note = requireOwnedNote(noteId, user);

        Group targetGroup = groupRepo.findByIdAndWorkspaceOwnerId(req.getTargetGroupId(), user.getId())
                .orElseThrow(() -> new NotlyException(ErrorCode.GROUP_NOT_FOUND,
                        "Target group " + req.getTargetGroupId() + " not found"));

        if (targetGroup.isLocked() || targetGroup.isSecure()) {
            throw new NotlyException(ErrorCode.ITEM_LOCKED, "Cannot move note to a locked/secure group");
        }

        UUID oldGroupId = note.getGroup().getId();
        note.setGroup(targetGroup);

        int newSortOrder = req.getSortOrder() != null
                ? req.getSortOrder()
                : noteRepo.maxSortOrderInGroup(req.getTargetGroupId()) + 1;
        note.setSortOrder(newSortOrder);

        note = noteRepo.save(note);

        activityLogService.log(user.getId(), lk.hemal.notly.entity.ActivityLog.EntityType.NOTE,
                note.getId(), lk.hemal.notly.entity.ActivityLog.ActivityAction.UPDATED,
                Map.of("from_group", oldGroupId, "to_group", req.getTargetGroupId()));

        log.info("[NOTE] Moved id={} from {} to {}", note.getId(), oldGroupId, req.getTargetGroupId());
        return noteMapper.toResponse(note);
    }

    @Override
    @Transactional
    public NoteResponse duplicateNote(UUID noteId, User user) {
        Note original = requireOwnedNote(noteId, user);

        Note copy = new Note();
        copy.setGroup(original.getGroup());
        copy.setOwner(user);
        copy.setTitle(original.getTitle() + " (copy)");
        copy.setContent(original.getContent());
        copy.setStatus(Note.NoteStatus.ACTIVE);
        copy.setVisibility(Note.Visibility.PRIVATE);
        copy.setLocked(false);
        copy.setFavorite(false);
        copy.setSortOrder(noteRepo.maxSortOrderInGroup(original.getGroup().getId()) + 1);

        copy = noteRepo.save(copy);

        activityLogService.log(user.getId(), lk.hemal.notly.entity.ActivityLog.EntityType.NOTE,
                copy.getId(), lk.hemal.notly.entity.ActivityLog.ActivityAction.CREATED,
                Map.of("original_id", original.getId(), "title", copy.getTitle()));

        log.info("[NOTE] Duplicated id={} -> new id={}", original.getId(), copy.getId());
        return noteMapper.toResponse(copy);
    }

    @Override
    @Transactional
    public NoteResponse copyNote(UUID noteId, CopyNoteRequest req, User user) {
        Note original = requireOwnedNote(noteId, user);

        Group targetGroup = groupRepo.findByIdAndWorkspaceOwnerId(req.getTargetGroupId(), user.getId())
                .orElseThrow(() -> new NotlyException(ErrorCode.GROUP_NOT_FOUND,
                        "Target group " + req.getTargetGroupId() + " not found"));

        if (targetGroup.isLocked() || targetGroup.isSecure()) {
            throw new NotlyException(ErrorCode.ITEM_LOCKED, "Cannot copy note to a locked/secure group");
        }

        Note copy = new Note();
        copy.setGroup(targetGroup);
        copy.setOwner(user);
        copy.setTitle(original.getTitle() + " (copy)");
        copy.setContent(original.getContent());
        copy.setStatus(Note.NoteStatus.ACTIVE);
        copy.setVisibility(Note.Visibility.PRIVATE);
        copy.setLocked(false);
        copy.setFavorite(false);
        copy.setSortOrder(noteRepo.maxSortOrderInGroup(req.getTargetGroupId()) + 1);

        copy = noteRepo.save(copy);

        activityLogService.log(user.getId(), lk.hemal.notly.entity.ActivityLog.EntityType.NOTE,
                copy.getId(), lk.hemal.notly.entity.ActivityLog.ActivityAction.CREATED,
                Map.of("original_id", original.getId(), "title", copy.getTitle()));

        log.info("[NOTE] Copied id={} -> new id={} in group {}", original.getId(), copy.getId(), req.getTargetGroupId());
        return noteMapper.toResponse(copy);
    }

    @Override
    @Transactional
    public NoteResponse archiveNote(UUID noteId, User user) {
        Note note = requireOwnedNote(noteId, user);

        note.setStatus(Note.NoteStatus.ARCHIVED);
        note.setArchivedAt(java.time.LocalDateTime.now());
        note = noteRepo.save(note);

        activityLogService.log(user.getId(), lk.hemal.notly.entity.ActivityLog.EntityType.NOTE,
                note.getId(), lk.hemal.notly.entity.ActivityLog.ActivityAction.ARCHIVED, null);

        log.info("[NOTE] Archived id={} user={}", note.getId(), user.getId());
        return noteMapper.toResponse(note);
    }

    @Override
    @Transactional
    public NoteResponse unarchiveNote(UUID noteId, User user) {
        Note note = requireOwnedNote(noteId, user);

        note.setStatus(Note.NoteStatus.ACTIVE);
        note.setArchivedAt(null);
        note = noteRepo.save(note);

        activityLogService.log(user.getId(), lk.hemal.notly.entity.ActivityLog.EntityType.NOTE,
                note.getId(), lk.hemal.notly.entity.ActivityLog.ActivityAction.RESTORED, null);

        log.info("[NOTE] Unarchived id={} user={}", note.getId(), user.getId());
        return noteMapper.toResponse(note);
    }

    @Override
    @Transactional
    public void softDeleteNote(UUID noteId, User user) {
        Note note = requireOwnedNote(noteId, user);

        note.softDelete();
        noteRepo.save(note);

        BinItem binItem = new BinItem();
        binItem.setOwner(user);
        binItem.setEntityType(BinItem.EntityType.NOTE);
        binItem.setEntityId(note.getId());
        binItem.setRestoreDeadline(java.time.LocalDateTime.now().plusDays(30));
        binItemRepo.save(binItem);

        activityLogService.log(user.getId(), lk.hemal.notly.entity.ActivityLog.EntityType.NOTE,
                note.getId(), lk.hemal.notly.entity.ActivityLog.ActivityAction.DELETED, null);

        log.info("[NOTE] Soft-deleted id={} user={}", note.getId(), user.getId());
    }

    @Override
    @Transactional
    public void lockNote(UUID noteId, LockRequest req, User user) {
        Note note = requireOwnedNote(noteId, user);

        if (note.isLocked()) {
            throw new NotlyException(ErrorCode.ITEM_ALREADY_LOCKED);
        }

        note.setLocked(true);
        note.setLockPasswordHash(passwordEncoder.encode(req.getPassword()));
        noteRepo.save(note);

        activityLogService.log(user.getId(), lk.hemal.notly.entity.ActivityLog.EntityType.NOTE,
                note.getId(), lk.hemal.notly.entity.ActivityLog.ActivityAction.LOCKED, null);

        log.info("[NOTE] Locked id={} user={}", note.getId(), user.getId());
    }

    @Override
    @Transactional
    public UnlockTokenResponse unlockNote(UUID noteId, UnlockRequest req, User user) {
        Note note = requireOwnedNote(noteId, user);

        if (!note.isLocked()) {
            throw new NotlyException(ErrorCode.ITEM_NOT_LOCKED);
        }

        String key = "NOTE:" + noteId + ":" + user.getId();
        lockAttemptService.assertNotBlocked(key);

        if (!passwordEncoder.matches(req.getPassword(), note.getLockPasswordHash())) {
            lockAttemptService.recordFailure(key);
            throw new NotlyException(ErrorCode.INVALID_LOCK_PASSWORD);
        }

        lockAttemptService.recordSuccess(key);

        String unlockToken = jwtUtil.generateUnlockToken(user.getId().toString(), "NOTE", noteId.toString());

        activityLogService.log(user.getId(), lk.hemal.notly.entity.ActivityLog.EntityType.NOTE,
                note.getId(), lk.hemal.notly.entity.ActivityLog.ActivityAction.UNLOCKED, null);

        log.info("[NOTE] Unlocked id={} user={}", note.getId(), user.getId());
        return new UnlockTokenResponse(unlockToken, 7200);
    }

    @Override
    @Transactional
    public void changeNoteLockPassword(UUID noteId, ChangeLockRequest req, User user) {
        Note note = requireOwnedNote(noteId, user);

        if (!note.isLocked()) {
            throw new NotlyException(ErrorCode.ITEM_NOT_LOCKED);
        }

        String key = "NOTE:" + noteId + ":" + user.getId();
        lockAttemptService.assertNotBlocked(key);

        if (!passwordEncoder.matches(req.getCurrentPassword(), note.getLockPasswordHash())) {
            lockAttemptService.recordFailure(key);
            throw new NotlyException(ErrorCode.INVALID_LOCK_PASSWORD);
        }

        note.setLockPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        noteRepo.save(note);

        lockAttemptService.recordSuccess(key);

        activityLogService.log(user.getId(), lk.hemal.notly.entity.ActivityLog.EntityType.NOTE,
                note.getId(), lk.hemal.notly.entity.ActivityLog.ActivityAction.UPDATED,
                Map.of("lock", "password_changed"));

        log.info("[NOTE] Lock password changed id={} user={}", note.getId(), user.getId());
    }

    @Override
    @Transactional
    public void removeNoteLock(UUID noteId, UnlockRequest req, User user) {
        Note note = requireOwnedNote(noteId, user);

        if (!note.isLocked()) {
            throw new NotlyException(ErrorCode.ITEM_NOT_LOCKED);
        }

        String key = "NOTE:" + noteId + ":" + user.getId();
        lockAttemptService.assertNotBlocked(key);

        if (!passwordEncoder.matches(req.getPassword(), note.getLockPasswordHash())) {
            lockAttemptService.recordFailure(key);
            throw new NotlyException(ErrorCode.INVALID_LOCK_PASSWORD);
        }

        note.setLocked(false);
        note.setLockPasswordHash(null);
        noteRepo.save(note);

        lockAttemptService.recordSuccess(key);

        activityLogService.log(user.getId(), lk.hemal.notly.entity.ActivityLog.EntityType.NOTE,
                note.getId(), lk.hemal.notly.entity.ActivityLog.ActivityAction.UNLOCKED, null);

        log.info("[NOTE] Lock removed id={} user={}", note.getId(), user.getId());
    }

    @Override
    @Transactional
    public ShareLinkResponse createNotePublicLink(UUID noteId, User user) {
        Note note = requireOwnedNote(noteId, user);

        if (note.isLocked()) {
            throw new NotlyException(ErrorCode.ITEM_LOCKED, "Cannot share a locked note publicly");
        }

        String shareToken = UUID.randomUUID().toString();
        note.setShareToken(shareToken);
        note.setVisibility(Note.Visibility.PUBLIC);
        noteRepo.save(note);

        activityLogService.log(user.getId(), lk.hemal.notly.entity.ActivityLog.EntityType.NOTE,
                note.getId(), lk.hemal.notly.entity.ActivityLog.ActivityAction.SHARED, null);

        log.info("[NOTE] Public link created id={} user={}", note.getId(), user.getId());
        return new ShareLinkResponse(shareToken, "/api/v1/notes/public/" + shareToken);
    }

    @Override
    @Transactional
    public ShareLinkResponse regenerateNotePublicLink(UUID noteId, User user) {
        Note note = requireOwnedNote(noteId, user);

        String shareToken = UUID.randomUUID().toString();
        note.setShareToken(shareToken);
        note.setVisibility(Note.Visibility.PUBLIC);
        noteRepo.save(note);

        log.info("[NOTE] Public link regenerated id={} user={}", note.getId(), user.getId());
        return new ShareLinkResponse(shareToken, "/api/v1/notes/public/" + shareToken);
    }

    @Override
    @Transactional
    public void revokeNotePublicLink(UUID noteId, User user) {
        Note note = requireOwnedNote(noteId, user);

        note.setShareToken(null);
        note.setVisibility(Note.Visibility.PRIVATE);
        noteRepo.save(note);

        activityLogService.log(user.getId(), lk.hemal.notly.entity.ActivityLog.EntityType.NOTE,
                note.getId(), lk.hemal.notly.entity.ActivityLog.ActivityAction.UNSHARED, null);

        log.info("[NOTE] Public link revoked id={} user={}", note.getId(), user.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public PublicGroupResponse getPublicGroupByToken(String token) {
        Group group = groupRepo.findByShareTokenAndVisibility(token, Group.Visibility.PUBLIC)
                .orElseThrow(() -> new NotlyException(ErrorCode.INVALID_SHARE_TOKEN));

        List<Note> notes = noteRepo.findByGroupIdOrderBySortOrderAscCreatedAtAsc(group.getId()).stream()
                .filter(n -> n.getStatus() == Note.NoteStatus.ACTIVE)
                .toList();

        List<PublicNoteResponse> noteResponses = notes.stream()
                .map(n -> new PublicNoteResponse(
                        n.getTitle(),
                        n.getContent(),
                        n.getOwner().getDisplayName(),
                        n.getOwner().getAvatarUrl(),
                        n.getCreatedAt(),
                        n.getUpdatedAt()
                ))
                .collect(Collectors.toList());

        return new PublicGroupResponse(group.getName(), group.getWorkspace().getOwner().getDisplayName(), noteResponses);
    }

    @Override
    @Transactional(readOnly = true)
    public PublicNoteResponse getPublicNoteByToken(String token) {
        Note note = noteRepo.findByShareTokenAndVisibility(token, Note.Visibility.PUBLIC)
                .orElseThrow(() -> new NotlyException(ErrorCode.INVALID_SHARE_TOKEN));

        return new PublicNoteResponse(
                note.getTitle(),
                note.getContent(),
                note.getOwner().getDisplayName(),
                note.getOwner().getAvatarUrl(),
                note.getCreatedAt(),
                note.getUpdatedAt()
        );
    }

    @Override
    @Transactional
    public NoteResponse toggleFavorite(UUID noteId, User user) {
        Note note = requireOwnedNote(noteId, user);
        note.setFavorite(!note.isFavorite());
        noteRepo.save(note);

        activityLogService.log(user.getId(), lk.hemal.notly.entity.ActivityLog.EntityType.NOTE,
                note.getId(), lk.hemal.notly.entity.ActivityLog.ActivityAction.FAVORITED, null);

        log.info("[NOTE] Toggled favorite id={} favorite={} user={}", note.getId(), note.isFavorite(), user.getId());
        return noteMapper.toResponse(note);
    }

    // ── Private Helpers ────────────────────────────────────────

    private Note requireOwnedNote(UUID noteId, User user) {
        return noteRepo.findByIdAndOwnerId(noteId, user.getId())
                .orElseThrow(() -> new NotlyException(ErrorCode.NOTE_NOT_FOUND,
                        "Note " + noteId + " not found"));
    }

    private boolean isGroupOrAncestorLocked(Group group, String unlockToken, User user) {
        Group current = group;
        while (current != null) {
            if (current.isLocked() || current.isSecure()) {
                if (unlockToken == null || !jwtUtil.isUnlockTokenValid(unlockToken,
                        user.getId().toString(), "GROUP", current.getId().toString())) {
                    return true;
                }
            }
            current = current.getParent();
        }
        return false;
    }

    private boolean isUnlockTokenValidForNote(String unlockToken, Note note, User user) {
        if (note.isLocked() && !jwtUtil.isUnlockTokenValid(unlockToken,
                user.getId().toString(), "NOTE", note.getId().toString())) {
            return false;
        }

        Group current = note.getGroup();
        while (current != null) {
            if (current.isLocked() || current.isSecure()) {
                if (!jwtUtil.isUnlockTokenValid(unlockToken,
                        user.getId().toString(), "GROUP", current.getId().toString())) {
                    return false;
                }
            }
            current = current.getParent();
        }

        return true;
    }
}
