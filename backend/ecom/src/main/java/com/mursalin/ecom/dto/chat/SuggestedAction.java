package com.mursalin.ecom.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SuggestedAction {
    private String label;
    private ActionType actionType;
    private Object payload;
}
