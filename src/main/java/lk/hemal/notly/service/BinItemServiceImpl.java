package lk.hemal.notly.service;

import lk.hemal.notly.repo.BinItemRepo;

public class BinItemServiceImpl implements BinItemService {

    private final BinItemRepo binItemRepo;

    public BinItemServiceImpl(BinItemRepo binItemRepo) {
        this.binItemRepo = binItemRepo;
    }
}
