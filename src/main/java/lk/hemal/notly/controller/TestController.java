package lk.hemal.notly.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/test")
public class TestController {

    @GetMapping
    public String TestGetMapping(){
        return "This is get mapping";
    }

    @PostMapping
    public String TestPostMapping(){
        return "This is Post Mapping";
    }

}