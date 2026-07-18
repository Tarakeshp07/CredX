package dev.credx.jobmatch.web;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/db")
@CrossOrigin(origins = "*")
public class DbViewerController {

    private final JdbcTemplate jdbc;

    public DbViewerController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * GET /db/tables - Lists all tables in H2 public schema.
     */
    @GetMapping("/tables")
    public List<String> listTables() {
        return jdbc.queryForList(
            "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='PUBLIC'", 
            String.class
        );
    }

    /**
     * GET /db/query?sql=... - Executes any SQL query and returns result list of rows.
     */
    @GetMapping("/query")
    public List<Map<String, Object>> query(@RequestParam String sql) {
        try {
            return jdbc.queryForList(sql);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return List.of(error);
        }
    }
}
