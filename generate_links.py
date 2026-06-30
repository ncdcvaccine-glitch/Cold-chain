rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    // يتحقق أن "linkToken" الموجود في الوثيقة فعلاً يخص نفس البلدية المذكورة فيها
    function tokenMatches(token, municipality) {
      return isSignedIn()
        && exists(/databases/$(database)/documents/links/$(token))
        && get(/databases/$(database)/documents/links/$(token)).data.municipality == municipality;
    }

    // روابط البلديات (Token -> Municipality): تُدار فقط يدوياً من Firestore Console
    // أو عبر سكريبت generate_links.py (الذي يستخدم صلاحيات كاملة بمفتاح الخدمة، يتجاوز هذه القواعد)
    match /links/{token} {
      allow read: if isSignedIn();
      allow write: if false; // لا يُسمح بالتعديل من المتصفح إطلاقاً، فقط من السكريبت بصلاحيات الخادم
    }

    // المراكز الصحية: أي مستخدم متصل (بما فيهم لوحة الإدارة) يقرأ الكل
    // لكن الإضافة/التعديل/الحذف تتطلب رمز رابط صالح يطابق البلدية المذكورة في الوثيقة
    match /centers/{centerId} {
      allow read: if isSignedIn();
      allow create: if tokenMatches(request.resource.data.linkToken, request.resource.data.municipality);
      allow update, delete: if tokenMatches(resource.data.linkToken, resource.data.municipality);
    }

    // المعدات: نفس منطق المراكز الصحية
    match /equipment/{equipId} {
      allow read: if isSignedIn();
      allow create: if tokenMatches(request.resource.data.linkToken, request.resource.data.municipality);
      allow update, delete: if tokenMatches(resource.data.linkToken, resource.data.municipality);
    }
  }
}
