package com.mursalin.ecom.dto.chat;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PageContext {
    @NotNull
    private PageType pageType;

    private Long entityId;
}
