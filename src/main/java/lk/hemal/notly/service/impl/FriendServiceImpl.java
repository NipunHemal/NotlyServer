package lk.hemal.notly.service.impl;

import lk.hemal.notly.repo.FriendRepo;
import lk.hemal.notly.service.FriendService;

public class FriendServiceImpl implements FriendService {

    private final FriendRepo friendRepo;

    public FriendServiceImpl(FriendRepo friendRepo) {
        this.friendRepo = friendRepo;
    }
}
