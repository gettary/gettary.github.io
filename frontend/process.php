<?php
// กำหนด Site Key และ Secret Key ของคุณ
define('SITE_KEY', '6LdwkJ0rAAAAAPCSrOEKdAYxehuAMHWIxuBH9cOb');
define('SECRET_KEY', '6LdwkJ0rAAAAABNLsQWxx4ZJuvU7D4hLDXGKDuCS');

// ตรวจสอบว่ามีข้อมูลส่งมาแบบ POST
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    // 1. Server-side validation สำหรับข้อมูลพื้นฐาน
    $firstName = trim($_POST['firstName'] ?? '');
    $lastName = trim($_POST['lastName'] ?? '');
    $recaptchaResponse = $_POST['recaptchaResponse'] ?? '';

    $errors = [];

    if (empty($firstName)) {
        $errors[] = "กรุณากรอกชื่อ";
    }
    if (empty($lastName)) {
        $errors[] = "กรุณากรอกนามสกุล";
    }

    if (empty($recaptchaResponse)) {
        $errors[] = "reCAPTCHA token ไม่ถูกต้อง";
    }

    if (count($errors) > 0) {
        // หากมีข้อผิดพลาดในการตรวจสอบข้อมูลพื้นฐาน
        echo "<h2>เกิดข้อผิดพลาด</h2>";
        foreach ($errors as $error) {
            echo "<p class='error-message'>- {$error}</p>";
        }
        echo "<p><a href='index.html'>กลับไปที่หน้าฟอร์ม</a></p>";
        exit;
    }

    // 2. ส่ง reCAPTCHA token ไปตรวจสอบกับ Google
    $url = 'https://www.google.com/recaptcha/api/siteverify';
    $data = [
        'secret' => SECRET_KEY,
        'response' => $recaptchaResponse
    ];

    $options = [
        'http' => [
            'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
            'method'  => 'POST',
            'content' => http_build_query($data)
        ]
    ];
    $context  = stream_context_create($options);
    $result = file_get_contents($url, false, $context);
    $response = json_decode($result);

    // 3. ตรวจสอบผลลัพธ์จาก Google
    if ($response->success == true && $response->score >= 0.5) { // 0.5 คือค่าคะแนนที่เรายอมรับได้
        // reCAPTCHA ผ่าน, แสดงผลลัพธ์
        echo "<h2>ข้อมูลที่ได้รับ</h2>";
        echo "<p><strong>ชื่อ:</strong> " . htmlspecialchars($firstName) . "</p>";
        echo "<p><strong>นามสกุล:</strong> " . htmlspecialchars($lastName) . "</p>";
        echo "<p class='success-message'>✅ การตรวจสอบ reCAPTCHA สำเร็จ! (คะแนน: {$response->score})</p>";
        // ตรงนี้สามารถเพิ่มโค้ดสำหรับบันทึกข้อมูลลงฐานข้อมูลได้
        echo "<p><a href='index.html'>กลับไปที่หน้าฟอร์ม</a></p>";
    } else {
        // reCAPTCHA ไม่ผ่าน
        echo "<h2>เกิดข้อผิดพลาด</h2>";
        echo "<p class='error-message'>❌ การตรวจสอบ reCAPTCHA ล้มเหลว กรุณาลองใหม่อีกครั้ง (คะแนน: {$response->score})</p>";
        echo "<p><a href='index.html'>กลับไปที่หน้าฟอร์ม</a></p>";
    }
} else {
    // หากไม่ได้ส่งข้อมูลมาด้วยเมธอด POST
    echo "<h2>เข้าถึงหน้าไม่ถูกต้อง</h2>";
    echo "<p>กรุณาส่งข้อมูลผ่านแบบฟอร์ม</p>";
    echo "<p><a href='index.html'>กลับไปที่หน้าฟอร์ม</a></p>";
}
?>
