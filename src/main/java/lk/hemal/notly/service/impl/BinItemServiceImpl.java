package lk.hemal.notly.service.impl;

import lk.hemal.notly.repo.BinItemRepo;
import lk.hemal.notly.service.BinItemService;

public class BinItemServiceImpl implements BinItemService {

    private final BinItemRepo binItemRepo;

    public BinItemServiceImpl(BinItemRepo binItemRepo) {
        this.binItemRepo = binItemRepo;
    }
}
