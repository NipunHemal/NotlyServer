package lk.hemal.notly.repo;

import lk.hemal.notly.entity.NoteVersion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface NoteVersionRepo extends JpaRepository<NoteVersion, UUID> {

    /**
     * Paginated version history for a note.
     */
    Page<NoteVersion> findByNoteIdOrderByVersionNumberDesc(UUID noteId, Pageable pageable);

    /**
     * Find a specific version by note + version number.
     */
    Optional<NoteVersion> findByNoteIdAndVersionNumber(UUID noteId, Long versionNumber);

    /**
     * Get the latest version for a note (highest version_number).
     */
    Optional<NoteVersion> findTopByNoteIdOrderByVersionNumberDesc(UUID noteId);

    /**
     * Check if a note has any versions.
     */
    boolean existsByNoteId(UUID noteId);

    /**
     * Count versions for a note.
     */
    long countByNoteId(UUID noteId);

    /**
     * Delete all versions for a note (used on permanent delete).
     */
    void deleteByNoteId(UUID noteId);

    /**
     * Find version by content hash for deduplication check.
     */
    @Query("SELECT v FROM NoteVersion v WHERE v.note.id = :noteId AND v.contentHash = :hash ORDER BY v.versionNumber DESC")
    Optional<NoteVersion> findLatestByNoteIdAndContentHash(@Param("noteId") UUID noteId, @Param("hash") String hash);
}