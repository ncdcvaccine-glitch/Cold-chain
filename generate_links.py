"""
generate_links.py
ينشئ رابطاً سرياً فريداً لكل بلدية من البلديات الـ101 (بدون كلمة مرور).
كل بلدية تفتح رابطها وتدخل مباشرة، ولا تقدر تعدّل بيانات بلدية أخرى.

الاستخدام:
1) pip install firebase-admin
2) نزّل مفتاح حساب الخدمة من Firebase Console وضعه باسم serviceAccountKey.json
3) عدّل BASE_URL أدناه إلى رابط موقعك الفعلي بعد النشر
   (مثال: https://coldchain-inventory.web.app/supervisor.html)
4) شغّل: python generate_links.py

النتيجة: ملف municipality_links.csv يحتوي على رابط خاص لكل بلدية —
أرسل كل رابط لمشرف البلدية المعنية فقط (مثلاً عبر واتساب)، ولا تشاركه مع غيرها.
"""

import csv
import secrets

import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# ⚠️ عدّل هذا الرابط إلى رابط موقعك الفعلي بعد النشر على Firebase Hosting
BASE_URL = "https://YOUR_PROJECT.web.app/supervisor.html"

MUNICIPALITIES = [
    "السواني", "السائح", "الزويتينة", "الزنتان", "الرياينة", "الرحيبات", "الجغبوب", "البيضان",
    "الابيار", "اجخرة", "ابوسليم", "بنغازي", "الجفارة", "المشاشية", "المرج", "الماية", "القلعة",
    "القره بوللي", "العجيلات", "الشرقية", "الشاطئ", "رقدالين", "درنة", "درج", "خليج السدرة",
    "جردي السيد", "جالو", "اوجلة", "توكرة", "تاورغاء", "تازربو", "تاجوراء", "بئر الاشهب", "ككلة",
    "قصر الخيار", "قصر بن غشير", "غريان", "غدامس", "عين زارة", "صرمان", "صبراتة", "شحات",
    "سوق الجمعة", "يفرن", "نسمة", "مسلاتة", "مزدة", "مرادة", "الاصابعة", "طرابلس المركز",
    "امساعد", "كاباو", "جنزور", "الرجبان", "جادو", "زليتن", "الخمس", "مصراته", "ام الرزم", "سلوق",
    "البيضاء", "الابرق", "الجميل", "الشويرف", "ساحل الاخضر", "قمينيس", "سرت", "اجدابيا", "سبها",
    "البريقة", "الزاوية المركز", "مرزق", "القبه", "وادي عتبة", "تراغن", "زوارة", "ترهونه",
    "اسبيعة", "الجفرة", "نالوت", "زلطن", "القطرون", "حرابة", "غات", "ظاهر الجبل", "القيقب",
    "سيناون", "تيناي", "المردوم", "زاوية الجنوبية", "باطن الجبل", "الحوامد", "ربيانة",
    "حي الاندلس", "الكفرة", "الزاوية الغربية", "بني وليد", "وادي الاجال", "سوق الخميس", "طبرق",
]


def main():
    rows = []
    for municipality in MUNICIPALITIES:
        token = secrets.token_urlsafe(16)  # رابط سري طويل يصعب تخمينه
        db.collection("links").document(token).set({"municipality": municipality})
        full_url = f"{BASE_URL}?key={token}"
        rows.append((municipality, full_url))
        print(f"✔ {municipality}")

    with open("municipality_links.csv", "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow(["البلدية", "الرابط الخاص"])
        writer.writerows(rows)

    print(f"\n📄 تم إنشاء {len(rows)} رابط، محفوظة في ملف municipality_links.csv")
    print("⚠️ أرسل كل رابط لمشرف البلدية المعنية فقط. لا تنشر الملف أو ترفعه على GitHub.")


if __name__ == "__main__":
    main()
