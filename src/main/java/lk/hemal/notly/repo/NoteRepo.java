package lk.hemal.notly.repo;

import lk.hemal.notly.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NoteRepo extends JpaRepository<Note, UUID> {

    List<Note> findByGroupIdOrderBySortOrderAscCreatedAtAsc(UUID groupId);

    Optional<Note> findByIdAndOwnerId(UUID id, UUID ownerId);

    List<Note> findByOwnerIdAndStatus(UUID ownerId, Note.NoteStatus status);

    Optional<Note> findByShareTokenAndVisibility(String shareToken, Note.Visibility visibility);

    @Query("select coalesce(max(n.sortOrder), -1) from Note n where n.group.id = ?1")
    int maxSortOrderInGroup(UUID groupId);

    long countByGroupId(UUID groupId);

    @Query(value = "SELECT * FROM notes WHERE id = ?1", nativeQuery = true)
    Optional<Note> findRawById(UUID id);

    @Query(value = "SELECT * FROM notes WHERE owner_id = ?1 AND deleted_at IS NOT NULL ORDER BY deleted_at DESC", nativeQuery = true)
    List<Note> findDeletedByOwner(UUID ownerId);

    @Modifying
    @Query(value = "UPDATE notes SET deleted_at = NULL, status = 'ACTIVE' WHERE id = ?1", nativeQuery = true)
    void restoreRaw(UUID id);

    @Modifying
    @Query(value = "DELETE FROM notes WHERE id = ?1", nativeQuery = true)
    void hardDelete(UUID id);

    @Query("SELECT n.contentHash FROM Note n WHERE n.id = ?1")
    Optional<String> findContentHashById(UUID id);

    long countByOwnerId(UUID ownerId);

    long countByOwnerIdAndIsFavoriteTrue(UUID ownerId);

    long countByOwnerIdAndStatus(UUID ownerId, Note.NoteStatus status);

    @Query("SELECT n FROM Note n WHERE n.owner.id = ?1 ORDER BY n.lastAutosaveAt DESC NULLS LAST, n.createdAt DESC")
    List<Note> findRecentByOwnerId(UUID ownerId, org.springframework.data.domain.Pageable pageable);
}
