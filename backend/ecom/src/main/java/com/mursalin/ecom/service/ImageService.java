package com.mursalin.ecom.service;

import com.mursalin.ecom.dto.ImageResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
public class ImageService {
    @Value("${imgur.upload.url}")
    private String IMGUR_UPLOAD_URL;

    @Value("${imgur.client.id}")
    private String CLIENT_ID;

    public ImageResponse uploadImage(MultipartFile imageFile) throws IOException {

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.set("Authorization", "Client-ID " + CLIENT_ID);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("image", new ByteArrayResource(imageFile.getBytes()) {
            @Override
            public String getFilename() {
                return imageFile.getOriginalFilename();
            }
        });

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        RestTemplate restTemplate = new RestTemplate();

        ResponseEntity<ImageResponse> response = restTemplate.postForEntity(IMGUR_UPLOAD_URL, requestEntity, ImageResponse.class);
        System.out.println(response.getBody());
        HttpHeaders responseHeaders = response.getHeaders();
        System.out.println("Client Remaining: " + responseHeaders.getFirst("X-RateLimit-ClientRemaining"));
        System.out.println("User Remaining: " + responseHeaders.getFirst("X-RateLimit-UserRemaining"));
        System.out.println("User Reset Time: " + responseHeaders.getFirst("X-RateLimit-UserReset"));

        if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
            throw new RuntimeException("Failed to upload image to Imgur");
        }
        System.out.println(" image service "+response.getBody().getDeleteHash());
        return response.getBody();
    }

    public void deleteImage(String deleteHash) {

        if( deleteHash == null)
            return;

        String deleteUrl = "https://api.imgur.com/3/image/" + deleteHash;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Client-ID " + CLIENT_ID); // Corrected `Client-ID` typo

        RestTemplate restTemplate = new RestTemplate();

        HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

        ResponseEntity<Void> response = restTemplate.exchange(deleteUrl, HttpMethod.DELETE, requestEntity, Void.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Failed to delete the image from Imgur");
        }
    }
}
