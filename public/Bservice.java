package com.example.demo.dpendencyTest; // 본인의 패키지명에 맞게 수정하세요

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
@Service
public class Bservice implements AB {

    @Override
    public void doWork() {
        System.out.println("Bservice is doing work");
    }
}