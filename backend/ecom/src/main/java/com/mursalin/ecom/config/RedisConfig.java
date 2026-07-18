package com.mursalin.ecom.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;

@Configuration
@EnableCaching
public class RedisConfig {

	@Bean
	public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
		RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
			.entryTtl(Duration.ofMinutes(10))
			.serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
			.serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(
				new GenericJackson2JsonRedisSerializer(objectMapper())
			));

		RedisCacheConfiguration homeProductsConfig = defaultConfig.entryTtl(Duration.ofMinutes(2));

		return RedisCacheManager.builder(connectionFactory)
			.withCacheConfiguration("homeProducts", homeProductsConfig)
			.cacheDefaults(defaultConfig)
			.build();
	}

	@Bean
	public ObjectMapper objectMapper() {
		ObjectMapper mapper = new ObjectMapper();
		mapper.activateDefaultTyping(
			LaissezFaireSubTypeValidator.instance,
			ObjectMapper.DefaultTyping.NON_FINAL,
			JsonTypeInfo.As.PROPERTY
		);
		return mapper;
	}
}
