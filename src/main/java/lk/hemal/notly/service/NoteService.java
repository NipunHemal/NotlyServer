package lk.hemal.notly.service;

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
import lk.hemal.notly.entity.Note;
import lk.hemal.notly.entity.User;

import java.util.List;
import java.util.UUID;

public interface NoteService {

    NoteResponse createNote(CreateNoteRequest req, User user);

    NoteResponse getNoteById(UUID noteId, User user, String unlockToken);

    List<NoteSummaryResponse> getNotesByGroupId(UUID groupId, User user);

    List<NoteSummaryResponse> getNotesByStatus(User user, Note.NoteStatus status);

    List<NoteSummaryResponse> getNotesByFavorite(User user);

    NoteResponse updateNote(UUID noteId, UpdateNoteRequest req, User user);

    NoteResponse moveNote(UUID noteId, MoveNoteRequest req, User user);

    NoteResponse duplicateNote(UUID noteId, User user);

    NoteResponse copyNote(UUID noteId, CopyNoteRequest req, User user);

    NoteResponse archiveNote(UUID noteId, User user);

    NoteResponse unarchiveNote(UUID noteId, User user);

    void softDeleteNote(UUID noteId, User user);

    void lockNote(UUID noteId, LockRequest req, User user);

    UnlockTokenResponse unlockNote(UUID noteId, UnlockRequest req, User user);

    void changeNoteLockPassword(UUID noteId, ChangeLockRequest req, User user);

    void removeNoteLock(UUID noteId, UnlockRequest req, User user);

    ShareLinkResponse createNotePublicLink(UUID noteId, User user);

    ShareLinkResponse regenerateNotePublicLink(UUID noteId, User user);

    void revokeNotePublicLink(UUID noteId, User user);

    PublicGroupResponse getPublicGroupByToken(String token);

    PublicNoteResponse getPublicNoteByToken(String token);

    NoteResponse toggleFavorite(UUID noteId, User user);
}
