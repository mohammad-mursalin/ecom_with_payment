package com.mursalin.ecom.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CategoryRequest {
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    @Size(min = 2, max = 100, message = "Slug must be between 2 and 100 characters")
    private String slug;

    private String icon;

    @Size(max = 500, message = "Description must be at most 500 characters")
    private String description;

    private Long parentId;
}
