package com.cupboard.api.repository;

import com.cupboard.api.entity.UserAuthProvider;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAuthProviderRepository extends JpaRepository<UserAuthProvider, Long> {}
