package lk.hemal.notly.repo;

import lk.hemal.notly.entity.Group;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GroupRepo extends JpaRepository<Group, UUID> {

    List<Group> findByWorkspaceIdAndParentIsNullOrderBySortOrderAsc(UUID workspaceId);

    List<Group> findByWorkspaceIdOrderBySortOrderAsc(UUID workspaceId);

    @Query("SELECT g FROM Group g WHERE g.workspace.id = :workspaceId ORDER BY g.sortOrder ASC")
    List<Group> findAllByWorkspaceId(@Param("workspaceId") UUID workspaceId);

    List<Group> findByParentIdOrderBySortOrderAsc(UUID parentId);

    Optional<Group> findByIdAndWorkspaceOwnerId(UUID id, UUID ownerId);

    List<Group> findByWorkspaceOwnerIdOrderBySortOrderAsc(UUID ownerId);

    Optional<Group> findByShareTokenAndVisibility(String shareToken, Group.Visibility visibility);

    int countByParentId(UUID parentId);

    boolean existsByParentIdAndNameIgnoreCase(UUID parentId, String name);

    @Query("select coalesce(max(g.sortOrder), -1) from Group g where (:parentId is null and g.parent is null) or g.parent.id = :parentId")
    int maxSortOrderAmongSiblings(@Param("parentId") UUID parentId);

    @Query(value = "SELECT * FROM groups WHERE id = ?1", nativeQuery = true)
    Optional<Group> findRawById(UUID id);

    @Modifying
    @Query(value = "UPDATE groups SET deleted_at = NULL WHERE id = ?1", nativeQuery = true)
    void restoreRaw(UUID id);

    @Modifying
    @Query(value = "DELETE FROM groups WHERE id = ?1", nativeQuery = true)
    void hardDelete(UUID id);
}
