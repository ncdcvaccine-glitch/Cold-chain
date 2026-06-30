"""
create_admin.py
ينشئ حساب الإدارة الوحيد (لوحة المشاهدة والتصدير). يُشغَّل مرة واحدة من جهازك.

الاستخدام:
1) pip install firebase-admin
2) نزّل مفتاح حساب الخدمة من Firebase Console وضعه باسم serviceAccountKey.json
3) شغّل: python create_admin.py
4) عدّل البريد وكلمة المرور أدناه قبل التشغيل إذا أردت
"""

import firebase_admin
from firebase_admin import credentials, auth, firestore

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

ADMIN_EMAIL = "admin@coldchain.ly"
ADMIN_PASSWORD = "ChangeMe123!"   # غيّرها قبل التشغيل أو بعده من Firebase Console
ADMIN_NAME = "إدارة المنصة"

try:
    user = auth.create_user(
        email=ADMIN_EMAIL,
        password=ADMIN_PASSWORD,
        display_name=ADMIN_NAME,
    )
    db.collection("users").document(user.uid).set({
        "role": "admin",
        "displayName": ADMIN_NAME,
    })
    print(f"✔ تم إنشاء حساب الإدارة بنجاح")
    print(f"  البريد: {ADMIN_EMAIL}")
    print(f"  كلمة المرور: {ADMIN_PASSWORD}")
    print("⚠️ غيّر كلمة المرور من Authentication > Users بعد أول تسجيل دخول.")
except Exception as e:
    print(f"خطأ: {e}")
