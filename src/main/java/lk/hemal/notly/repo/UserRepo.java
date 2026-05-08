package lk.hemal.notly.repo;

import lk.hemal.notly.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import javax.swing.text.html.Option;
import java.util.Optional;
import java.util.UUID;

public interface  UserRepo extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    Optional<User> findUserById(UUID id);

    @Query("SELECT u FROM User u WHERE u.email = :identifier OR u.username = :identifier")
    Optional<User> findByEmailOrUsername(@Param("identifier") String identifier);

    Optional<User> findByOauthProviderAndProviderId(
            User.OAuthProvider oauthProvider,
            String oauthProviderId
    );

    boolean existsByEmail(String email);
    boolean existsByUsername(String username);

    // ── Custom JPQL Query ─────────────────────────────────────

    // if deactivate user then use soft delete
//    @Modifying
//    @Query("UPDATE User u SET u.isActive = false WHERE u.id = :id")
//    void deactivateUser(@Param("id") UUID id);
}