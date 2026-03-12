---
title: 'test'
date: '2026-03-12 10:58'
description: 'test'
tag: 'test'
---

```java
	// 콤마 제거 및 공백/빈문자열 null 처리 
	public static String cleanString(String text) {
	    if (text == null) return null;

	    // 1. 앞뒤 공백 제거
	    String trimmed = text.trim();

	    // 2. 공백 제거 후 길이가 0이면 null 반환 (핵심: DB에 NULL로 들어가게 함)
	    if (trimmed.isEmpty()) {
	        return null; 
	    }

	    // 3. 콤마 제거 (숫자형 데이터 처리를 위해)
	    return trimmed.replace(",", "");
	} 

    //private static final String ROOT_PATH = "D:\\mes\\"; 
	private static final String ROOT_PATH = "\\\\192.168.2.135\\TEST\\";
```