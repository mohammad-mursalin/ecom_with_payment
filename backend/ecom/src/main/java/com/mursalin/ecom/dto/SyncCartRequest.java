package com.mursalin.ecom.dto;

import lombok.Data;

@Data
public class SyncCartRequest {
    private java.util.List<SyncCartItem> items;
}
