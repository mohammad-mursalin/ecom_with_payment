package com.mursalin.ecom.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WishlistResponse {
    private List<WishlistItemResponse> items;
    private int totalCount;
}
