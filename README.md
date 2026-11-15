# Ko‘zlarini tiysinlar! — mustaqil yaxshilangan versiya

Bu **alohida yozilgan statik veb-ilova**. U boshqa kishining GitHub repositorysini tahrirlamaydi, fayllarini almashtirmaydi va original repo bilan avtomatik sinxronlanmaydi. Ko‘rinishida to‘q rang + bordo ruhiyati saqlangan; kod, sahifa tuzilishi, o‘rnatish fayllari alohida tayyorlangan.

## Nimalar ishlaydi?

- Bir yoki ikki martalik kundalik reja, boshlanish/tugash vaqti, izoh.
- Har kuni, tanlangan hafta kunlarida yoki bir marta takrorlash.
- Eslatma: yo‘q / vaqtida / 5, 10, 15, 30, 60 daqiqa oldin.
- So‘nggi va keyingi vazifa doiralari, ular orasida real vaqtda to‘lib boruvchi chiziq, jonli teskari vaqt hisoblagichi.
- Vazifalarni bajarildi deb belgilash, tahrirlash, o‘chirish, hafta bo‘ylab ko‘rish.
- 7 kunlik diagramma, 30 kunlik bajarilish foizi, ketma-ket kunlar soni.
- Mahalliy `localStorage` bazasi, JSON eksport/import, oddiy offline PWA.
- Ruxsat bilan **sahifa JavaScript'i ishlayotganida** brauzer bildirishnomalari; in-app toast.
- Ruxsat berish ixtiyoriy; qulf ekranida nomni yashirish tanlovi.

## Ishga tushirish

1. Fayllarni yangi katalogga chiqarib oling. `index.html` yonida `app.js`, `styles.css`, `sw.js`, `manifest.webmanifest`, ikonalar bo‘lishi kerak.
2. Tekshirish uchun shu katalogda `python -m http.server 8000` ishga tushiring, brauzerda `http://localhost:8000`ni oching.
3. Saytni internetga chiqarish uchun **yangi, o‘zingizga tegishli GitHub repository** yarating, mazkur fayllarni o‘sha repositoryning ildiziga yuklang, Settings → Pages → Deploy from a branch → `main` / root ni belgilang.
4. Yoki fayllarni o‘zingiz ishlatayotgan sayt quruvchi platformaga statik sayt sifatida import qiling.
5. Brauzerda bildirishnomalarni yoqish uchun HTTPS manzilida Sozlamalar → Bildirishnomalar → Yoqish tugmasini bosing. Foydalanuvchi bu ruxsatni istalgan payt brauzer sozlamalarida olib tashlay oladi.

## Eski tracker ma'lumotlari

Brauzer xavfsizligi sababli boshqa domen `localStorage`idagi ma'lumotlarni avtomatik o‘qib bo‘lmaydi. Agar avvalgi ilovadan **o‘zingizga tegishli JSON zaxira nusxasi** bo‘lsa, Sozlamalar → Import orqali ko‘chirib ko‘rishingiz mumkin. Eski `habits` formatida faqat reja nomlari va takrorlash sxemasi taxminiy moslanadi; tarixiy bajarilish belgilari avtomatik import qilinmaydi. Yangi rejalarga oldindan belgilangan 09:00 vaqt qo‘yilishi mumkin — o‘zingiz tahrirlang.

## Texnik cheklov

GitHub Pages serveri yo‘q statik hosting hisoblanadi. Shu sababli sahifa yopiq yoki mobil tizim uni uxlatib qo‘ygan paytda eslatmalarni aniq vaqtda yuborish **kafolatlanmaydi**. Telefonning bildirishnomalar panelida doimiy animatsiyali `ongoing` xabar yaratish uchun Android ilova/foreground service kerak. Bu veb-ilovada doimiy animatsiya **ochiq sahifa ichida** mavjud.

## Maxfiylik va litsenziya

Ushbu mustaqil kod uchinchi tomon kuzatuv/analitika skriptlaridan foydalanmaydi. Rejalar foydalanuvchining qurilmasida saqlanadi. Bu paket o‘zi bilan original repositoryning mualliflikka oid CSS, script, rasmlari va hadislar to‘plamini olib kelmaydi.