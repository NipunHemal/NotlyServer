package lk.hemal.notly.repo;

import lk.hemal.notly.entity.Friend;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface FriendRepo extends JpaRepository<Friend, UUID> {
}
