package lk.hemal.notly.service;

import lk.hemal.notly.repo.FriendRepo;

public class FriendServiceImpl implements FriendService {

    private final FriendRepo friendRepo;

    public FriendServiceImpl(FriendRepo friendRepo) {
        this.friendRepo = friendRepo;
    }
}
