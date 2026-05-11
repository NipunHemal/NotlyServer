package lk.hemal.notly.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/test")
@Tag(name = "Test", description = "Simple test endpoints for health and connectivity checks")
public class TestController {

    @Operation(summary = "Test GET endpoint", description = "Returns a simple string to verify GET connectivity.")
    @GetMapping
    public String testGetMapping() {
        return "This is get mapping";
    }

    @Operation(summary = "Test POST endpoint", description = "Returns a simple string to verify POST connectivity.")
    @PostMapping
    public String testPostMapping() {
        return "This is Post Mapping";
    }
}
