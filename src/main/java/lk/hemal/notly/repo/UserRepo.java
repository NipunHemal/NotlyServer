package lk.hemal.notly.repo;

import lk.hemal.notly.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface  UserRepo extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    Optional<User> findByOauthProviderAndProviderId(
            User.OAuthProvider oauthProvider,
            String oauthProviderId
    );

    boolean existsByEmail(String email);
    boolean existsByUsername(String username);

    // ── Custom JPQL Query ─────────────────────────────────────

    // allow login email or password
//    @Query("""
//        SELECT u FROM User u
//        WHERE u.email = :identifier
//           OR u.username = :identifier
//    """)
//    Optional<User> findByEmailOrUsername(@Param("identifier") String identifier);

    // if deactivate user then use soft delete
//    @Modifying
//    @Query("UPDATE User u SET u.isActive = false WHERE u.id = :id")
//    void deactivateUser(@Param("id") UUID id);
}