package com.mursalin.ecom.service;

import com.mursalin.ecom.dto.ImageResponse;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface ImageService {
    ImageResponse uploadImage(MultipartFile imageFile) throws IOException;

    void deleteImage(String deleteHash);
}
