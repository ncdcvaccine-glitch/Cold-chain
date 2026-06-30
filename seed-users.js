/**
 * seed-users.js
 * سكريبت مساعد (يُشغَّل مرة واحدة من جهازك، خارج المنصة) لإنشاء حساب دخول
 * تلقائياً لكل بلدية من البلديات الـ101، بالإضافة إلى حساب الإدارة.
 *
 * طريقة الاستخدام:
 * 1) npm install firebase-admin
 * 2) نزّل مفتاح حساب الخدمة من:
 *    Firebase Console > Project Settings > Service Accounts > Generate new private key
 *    وضعه في نفس المجلد باسم serviceAccountKey.json
 * 3) شغّل: node seed-users.js
 *
 * كل بلدية ستحصل على:
 *   البريد الإلكتروني: <رقم>@coldchain.ly   (مثال: 1@coldchain.ly)
 *   كلمة المرور: قيمة عشوائية تُطبع في الطرفية (سجّلها فوراً)
 */

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const MUNICIPALITIES = [
  "السواني","السائح","الزويتينة","الزنتان","الرياينة","الرحيبات","الجغبوب","البيضان",
  "الابيار","اجخرة","ابوسليم","بنغازي","الجفارة","المشاشية","المرج","الماية","القلعة",
  "القره بوللي","العجيلات","الشرقية","الشاطئ","رقدالين","درنة","درج","خليج السدرة",
  "جردي السيد","جالو","اوجلة","توكرة","تاورغاء","تازربو","تاجوراء","بئر الاشهب","ككلة",
  "قصر الخيار","قصر بن غشير","غريان","غدامس","عين زارة","صرمان","صبراتة","شحات",
  "سوق الجمعة","يفرن","نسمة","مسلاتة","مزدة","مرادة","الاصابعة","طرابلس المركز",
  "امساعد","كاباو","جنزور","الرجبان","جادو","زليتن","الخمس","مصراته","ام الرزم","سلوق",
  "البيضاء","الابرق","الجميل","الشويرف","ساحل الاخضر","قمينيس","سرت","اجدابيا","سبها",
  "البريقة","الزاوية المركز","مرزق","القبه","وادي عتبة","تراغن","زوارة","ترهونه",
  "اسبيعة","الجفرة","نالوت","زلطن","القطرون","حرابة","غات","ظاهر الجبل","القيقب",
  "سيناون","تيناي","المردوم","زاوية الجنوبية","باطن الجبل","الحوامد","ربيانة",
  "حي الاندلس","الكفرة","الزاوية الغربية","بني وليد","وادي الاجال","سوق الخميس","طبرق"
];

function randomPassword() {
  return Math.random().toString(36).slice(-6) + Math.floor(Math.random()*90+10);
}

async function run() {
  const db = admin.firestore();
  const results = [];

  // حساب الإدارة (مرة واحدة فقط) — غيّر البريد وكلمة المرور قبل التشغيل
  try {
    const adminUser = await admin.auth().createUser({
      email: "admin@coldchain.ly",
      password: "ChangeMe123!",
      displayName: "إدارة المنصة"
    });
    await db.collection("users").doc(adminUser.uid).set({
      role: "admin",
      displayName: "إدارة المنصة"
    });
    results.push({ municipality: "(حساب الإدارة)", email: "admin@coldchain.ly", password: "ChangeMe123!" });
  } catch (e) {
    console.log("تنبيه (حساب الإدارة):", e.message);
  }

  for (let i = 0; i < MUNICIPALITIES.length; i++) {
    const municipality = MUNICIPALITIES[i];
    const email = `m${i + 1}@coldchain.ly`;
    const password = randomPassword();
    try {
      const userRecord = await admin.auth().createUser({
        email, password, displayName: `مشرف بلدية ${municipality}`
      });
      await db.collection("users").doc(userRecord.uid).set({
        role: "supervisor",
        municipality,
        displayName: `مشرف بلدية ${municipality}`
      });
      results.push({ municipality, email, password });
      console.log(`✔ ${municipality} -> ${email}`);
    } catch (e) {
      console.log(`✘ خطأ في ${municipality}:`, e.message);
    }
  }

  console.table(results);
  console.log("⚠️ احفظ هذا الجدول فوراً (كلمات المرور لن تظهر مرة أخرى).");
}

run();
