package com.mursalin.ecom.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StructuredData {
    private StructuredDataType type;
    private Object[] items;
}
