package lk.hemal.notly.scheduler;

import lk.hemal.notly.entity.ActivityLog;
import lk.hemal.notly.entity.BinItem;
import lk.hemal.notly.entity.Group;
import lk.hemal.notly.entity.Note;
import lk.hemal.notly.repo.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class BinPurgeScheduler {

    private final BinItemRepo binItemRepo;
    private final NoteRepo noteRepo;
    private final GroupRepo groupRepo;
    private final CollaboratorRepo collaboratorRepo;
    private final ReminderRepo reminderRepo;
    private final NoteTagRepo noteTagRepo;
    private final NoteMediaRepo noteMediaRepo;
    private final ActivityLogRepo activityLogRepo;
    private final GroupCollaboratorRepo groupCollaboratorRepo;

    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void purgeExpiredBinItems() {
        LocalDateTime now = LocalDateTime.now();
        List<BinItem> expiredItems = binItemRepo.findByRestoreDeadlineBefore(now);

        int count = 0;
        for (BinItem item : expiredItems) {
            try {
                if (item.getEntityType() == BinItem.EntityType.NOTE) {
                    permanentDeleteNote(item.getEntityId());
                } else if (item.getEntityType() == BinItem.EntityType.GROUP) {
                    permanentDeleteGroupSubtree(item.getEntityId());
                }
                binItemRepo.delete(item);
                count++;
            } catch (Exception e) {
                log.warn("[BIN] Failed to purge item id={}: {}", item.getId(), e.getMessage());
            }
        }

        if (count > 0) {
            log.info("[BIN] Purged {} expired items", count);
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