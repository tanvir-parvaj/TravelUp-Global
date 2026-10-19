const { pool } = require('../config/db');
const fs = require('fs');
const path = require('path');

const csvData = `division_id,name_en,name_bn,parent_country_id,latitude,longitude
BD-DIV-01,Chattagram,চট্টগ্রাম,COUNTRY-BD,22.356851,91.783182
BD-DIV-02,Rajshahi,রাজশাহী,COUNTRY-BD,24.363589,88.624135
BD-DIV-03,Khulna,খুলনা,COUNTRY-BD,22.845641,89.540328
BD-DIV-04,Barisal,বরিশাল,COUNTRY-BD,22.701002,90.353451
BD-DIV-05,Sylhet,সিলেট,COUNTRY-BD,24.894929,91.868706
BD-DIV-06,Dhaka,ঢাকা,COUNTRY-BD,23.810332,90.412518
BD-DIV-07,Rangpur,রংপুর,COUNTRY-BD,25.743892,89.275227
BD-DIV-08,Mymensingh,ময়মনসিংহ,COUNTRY-BD,24.747149,90.420273
district_id,name_en,name_bn,division_id,division_name_en,division_name_bn,latitude,longitude
BD-DIV-01-DIST-01,Comilla,কুমিল্লা,BD-DIV-01,Chattagram,চট্টগ্রাম,23.4682747,91.1788135
BD-DIV-01-DIST-02,Feni,ফেনী,BD-DIV-01,Chattagram,চট্টগ্রাম,23.023231,91.3840844
BD-DIV-01-DIST-03,Brahmanbaria,ব্রাহ্মণবাড়িয়া,BD-DIV-01,Chattagram,চট্টগ্রাম,23.9570904,91.1119286
BD-DIV-01-DIST-04,Rangamati,রাঙ্গামাটি,BD-DIV-01,Chattagram,চট্টগ্রাম,22.65561018,92.17541121
BD-DIV-01-DIST-05,Noakhali,নোয়াখালী,BD-DIV-01,Chattagram,চট্টগ্রাম,22.869563,91.099398
BD-DIV-01-DIST-06,Chandpur,চাঁদপুর,BD-DIV-01,Chattagram,চট্টগ্রাম,23.2332585,90.6712912
BD-DIV-01-DIST-07,Lakshmipur,লক্ষ্মীপুর,BD-DIV-01,Chattagram,চট্টগ্রাম,22.942477,90.841184
BD-DIV-01-DIST-08,Chattogram,চট্টগ্রাম,BD-DIV-01,Chattagram,চট্টগ্রাম,22.335109,91.834073
BD-DIV-01-DIST-09,Coxsbazar,কক্সবাজার,BD-DIV-01,Chattagram,চট্টগ্রাম,21.44315751,91.97381741
BD-DIV-01-DIST-10,Khagrachhari,খাগড়াছড়ি,BD-DIV-01,Chattagram,চট্টগ্রাম,23.119285,91.984663
BD-DIV-01-DIST-11,Bandarban,বান্দরবান,BD-DIV-01,Chattagram,চট্টগ্রাম,22.1953275,92.2183773
BD-DIV-02-DIST-01,Sirajganj,সিরাজগঞ্জ,BD-DIV-02,Rajshahi,রাজশাহী,24.4533978,89.7006815
BD-DIV-02-DIST-02,Pabna,পাবনা,BD-DIV-02,Rajshahi,রাজশাহী,23.998524,89.233645
BD-DIV-02-DIST-03,Bogura,বগুড়া,BD-DIV-02,Rajshahi,রাজশাহী,24.8465228,89.377755
BD-DIV-02-DIST-04,Rajshahi,রাজশাহী,BD-DIV-02,Rajshahi,রাজশাহী,24.37230298,88.56307623
BD-DIV-02-DIST-05,Natore,নাটোর,BD-DIV-02,Rajshahi,রাজশাহী,24.420556,89.000282
BD-DIV-02-DIST-06,Joypurhat,জয়পুরহাট,BD-DIV-02,Rajshahi,রাজশাহী,25.09636876,89.04004280
BD-DIV-02-DIST-07,Chapainawabganj,চাঁপাইনবাবগঞ্জ,BD-DIV-02,Rajshahi,রাজশাহী,24.5965034,88.2775122
BD-DIV-02-DIST-08,Naogaon,নওগাঁ,BD-DIV-02,Rajshahi,রাজশাহী,24.83256191,88.92485205
BD-DIV-03-DIST-01,Jashore,যশোর,BD-DIV-03,Khulna,খুলনা,23.16643,89.2081126
BD-DIV-03-DIST-02,Satkhira,সাতক্ষীরা,BD-DIV-03,Khulna,খুলনা,22.7180905,89.0687033
BD-DIV-03-DIST-03,Meherpur,মেহেরপুর,BD-DIV-03,Khulna,খুলনা,23.762213,88.631821
BD-DIV-03-DIST-04,Narail,নড়াইল,BD-DIV-03,Khulna,খুলনা,23.172534,89.512672
BD-DIV-03-DIST-05,Chuadanga,চুয়াডাঙ্গা,BD-DIV-03,Khulna,খুলনা,23.6401961,88.841841
BD-DIV-03-DIST-06,Kushtia,কুষ্টিয়া,BD-DIV-03,Khulna,খুলনা,23.901258,89.120482
BD-DIV-03-DIST-07,Magura,মাগুরা,BD-DIV-03,Khulna,খুলনা,23.487337,89.419956
BD-DIV-03-DIST-08,Khulna,খুলনা,BD-DIV-03,Khulna,খুলনা,22.815774,89.568679
BD-DIV-03-DIST-09,Bagerhat,বাগেরহাট,BD-DIV-03,Khulna,খুলনা,22.651568,89.785938
BD-DIV-03-DIST-10,Jhenaidah,ঝিনাইদহ,BD-DIV-03,Khulna,খুলনা,23.5448176,89.1539213
BD-DIV-04-DIST-01,Jhalakathi,ঝালকাঠি,BD-DIV-04,Barisal,বরিশাল,22.6422689,90.2003932
BD-DIV-04-DIST-02,Patuakhali,পটুয়াখালী,BD-DIV-04,Barisal,বরিশাল,22.3596316,90.3298712
BD-DIV-04-DIST-03,Pirojpur,পিরোজপুর,BD-DIV-04,Barisal,বরিশাল,22.5781398,89.9983909
BD-DIV-04-DIST-04,Barisal,বরিশাল,BD-DIV-04,Barisal,বরিশাল,22.7004179,90.3731568
BD-DIV-04-DIST-05,Bhola,ভোলা,BD-DIV-04,Barisal,বরিশাল,22.685923,90.648179
BD-DIV-04-DIST-06,Barguna,বরগুনা,BD-DIV-04,Barisal,বরিশাল,22.159182,90.125581
BD-DIV-05-DIST-01,Sylhet,সিলেট,BD-DIV-05,Sylhet,সিলেট,24.8897956,91.8697894
BD-DIV-05-DIST-02,Moulvibazar,মৌলভীবাজার,BD-DIV-05,Sylhet,সিলেট,24.482934,91.777417
BD-DIV-05-DIST-03,Habiganj,হবিগঞ্জ,BD-DIV-05,Sylhet,সিলেট,24.374945,91.41553
BD-DIV-05-DIST-04,Sunamganj,সুনামগঞ্জ,BD-DIV-05,Sylhet,সিলেট,25.0658042,91.3950115
BD-DIV-06-DIST-01,Narsingdi,নরসিংদী,BD-DIV-06,Dhaka,ঢাকা,23.932233,90.71541
BD-DIV-06-DIST-02,Gazipur,গাজীপুর,BD-DIV-06,Dhaka,ঢাকা,24.0022858,90.4264283
BD-DIV-06-DIST-03,Shariatpur,শরীয়তপুর,BD-DIV-06,Dhaka,ঢাকা,23.2060195,90.3477725
BD-DIV-06-DIST-04,Narayanganj,নারায়ণগঞ্জ,BD-DIV-06,Dhaka,ঢাকা,23.63366,90.496482
BD-DIV-06-DIST-05,Tangail,টাঙ্গাইল,BD-DIV-06,Dhaka,ঢাকা,24.264145,89.918029
BD-DIV-06-DIST-06,Kishoreganj,কিশোরগঞ্জ,BD-DIV-06,Dhaka,ঢাকা,24.444937,90.776575
BD-DIV-06-DIST-07,Manikganj,মানিকগঞ্জ,BD-DIV-06,Dhaka,ঢাকা,23.8602262,90.0018293
BD-DIV-06-DIST-08,Dhaka,ঢাকা,BD-DIV-06,Dhaka,ঢাকা,23.7115253,90.4111451
BD-DIV-06-DIST-09,Munshiganj,মুন্সিগঞ্জ,BD-DIV-06,Dhaka,ঢাকা,23.5435742,90.5354327
BD-DIV-06-DIST-10,Rajbari,রাজবাড়ী,BD-DIV-06,Dhaka,ঢাকা,23.7574305,89.6444665
BD-DIV-06-DIST-11,Madaripur,মাদারীপুর,BD-DIV-06,Dhaka,ঢাকা,23.164102,90.1896805
BD-DIV-06-DIST-12,Gopalganj,গোপালগঞ্জ,BD-DIV-06,Dhaka,ঢাকা,23.0050857,89.8266059
BD-DIV-06-DIST-13,Faridpur,ফরিদপুর,BD-DIV-06,Dhaka,ঢাকা,23.6070822,89.8429406
BD-DIV-07-DIST-01,Panchagarh,পঞ্চগড়,BD-DIV-07,Rangpur,রংপুর,26.3411,88.5541606
BD-DIV-07-DIST-02,Dinajpur,দিনাজপুর,BD-DIV-07,Rangpur,রংপুর,25.6217061,88.6354504
BD-DIV-07-DIST-03,Lalmonirhat,লালমনিরহাট,BD-DIV-07,Rangpur,রংপুর,25.9165451,89.4532409
BD-DIV-07-DIST-04,Nilphamari,নীলফামারী,BD-DIV-07,Rangpur,রংপুর,25.931794,88.856006
BD-DIV-07-DIST-05,Gaibandha,গাইবান্ধা,BD-DIV-07,Rangpur,রংপুর,25.328751,89.528088
BD-DIV-07-DIST-06,Thakurgaon,ঠাকুরগাঁও,BD-DIV-07,Rangpur,রংপুর,26.0336945,88.4616834
BD-DIV-07-DIST-07,Rangpur,রংপুর,BD-DIV-07,Rangpur,রংপুর,25.7558096,89.244462
BD-DIV-07-DIST-08,Kurigram,কুড়িগ্রাম,BD-DIV-07,Rangpur,রংপুর,25.805445,89.636174
BD-DIV-08-DIST-01,Sherpur,শেরপুর,BD-DIV-08,Mymensingh,ময়মনসিংহ,25.0204933,90.0152966
BD-DIV-08-DIST-02,Mymensingh,ময়মনসিংহ,BD-DIV-08,Mymensingh,ময়মনসিংহ,24.7465670,90.4072093
BD-DIV-08-DIST-03,Jamalpur,জামালপুর,BD-DIV-08,Mymensingh,ময়মনসিংহ,24.937533,89.937775
BD-DIV-08-DIST-04,Netrokona,নেত্রকোণা,BD-DIV-08,Mymensingh,ময়মনসিংহ,24.870955,90.727887
upazila_id,name_en,name_bn,district_id,district_name_en,district_name_bn,division_id,division_name_en,division_name_bn
BD-DIV-01-DIST-01-UPZ-001,Debidwar,দেবিদ্বার,BD-DIV-01-DIST-01,Comilla,কুমিল্লা,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-01-UPZ-002,Barura,বরুড়া,BD-DIV-01-DIST-01,Comilla,কুমিল্লা,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-01-UPZ-003,Brahmanpara,ব্রাহ্মণপাড়া,BD-DIV-01-DIST-01,Comilla,কুমিল্লা,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-01-UPZ-004,Chandina,চান্দিনা,BD-DIV-01-DIST-01,Comilla,কুমিল্লা,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-01-UPZ-005,Chauddagram,চৌদ্দগ্রাম,BD-DIV-01-DIST-01,Comilla,কুমিল্লা,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-01-UPZ-006,Daudkandi,দাউদকান্দি,BD-DIV-01-DIST-01,Comilla,কুমিল্লা,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-01-UPZ-007,Homna,হোমনা,BD-DIV-01-DIST-01,Comilla,কুমিল্লা,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-01-UPZ-008,Laksam,লাকসাম,BD-DIV-01-DIST-01,Comilla,কুমিল্লা,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-01-UPZ-009,Muradnagar,মুরাদনগর,BD-DIV-01-DIST-01,Comilla,কুমিল্লা,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-01-UPZ-010,Nangalkot,নাঙ্গলকোট,BD-DIV-01-DIST-01,Comilla,কুমিল্লা,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-01-UPZ-011,Comilla Sadar,কুমিল্লা সদর,BD-DIV-01-DIST-01,Comilla,কুমিল্লা,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-01-UPZ-012,Meghna,মেঘনা,BD-DIV-01-DIST-01,Comilla,কুমিল্লা,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-01-UPZ-013,Monohargonj,মনোহরগঞ্জ,BD-DIV-01-DIST-01,Comilla,কুমিল্লা,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-01-UPZ-014,Sadarsouth,সদর দক্ষিণ,BD-DIV-01-DIST-01,Comilla,কুমিল্লা,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-01-UPZ-015,Titas,তিতাস,BD-DIV-01-DIST-01,Comilla,কুমিল্লা,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-01-UPZ-016,Burichang,বুড়িচং,BD-DIV-01-DIST-01,Comilla,কুমিল্লা,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-01-UPZ-017,Lalmai,লালমাই,BD-DIV-01-DIST-01,Comilla,কুমিল্লা,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-02-UPZ-001,Chhagalnaiya,ছাগলনাইয়া,BD-DIV-01-DIST-02,Feni,ফেনী,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-02-UPZ-002,Feni Sadar,ফেনী সদর,BD-DIV-01-DIST-02,Feni,ফেনী,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-02-UPZ-003,Sonagazi,সোনাগাজী,BD-DIV-01-DIST-02,Feni,ফেনী,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-02-UPZ-004,Fulgazi,ফুলগাজী,BD-DIV-01-DIST-02,Feni,ফেনী,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-02-UPZ-005,Parshuram,পরশুরাম,BD-DIV-01-DIST-02,Feni,ফেনী,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-02-UPZ-006,Daganbhuiyan,দাগনভূঞা,BD-DIV-01-DIST-02,Feni,ফেনী,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-03-UPZ-001,Brahmanbaria Sadar,ব্রাহ্মণবাড়িয়া সদর,BD-DIV-01-DIST-03,Brahmanbaria,ব্রাহ্মণবাড়িয়া,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-03-UPZ-002,Kasba,কসবা,BD-DIV-01-DIST-03,Brahmanbaria,ব্রাহ্মণবাড়িয়া,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-03-UPZ-003,Nasirnagar,নাসিরনগর,BD-DIV-01-DIST-03,Brahmanbaria,ব্রাহ্মণবাড়িয়া,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-03-UPZ-004,Sarail,সরাইল,BD-DIV-01-DIST-03,Brahmanbaria,ব্রাহ্মণবাড়িয়া,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-03-UPZ-005,Ashuganj,আশুগঞ্জ,BD-DIV-01-DIST-03,Brahmanbaria,ব্রাহ্মণবাড়িয়া,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-03-UPZ-006,Akhaura,আখাউড়া,BD-DIV-01-DIST-03,Brahmanbaria,ব্রাহ্মণবাড়িয়া,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-03-UPZ-007,Nabinagar,নবীনগর,BD-DIV-01-DIST-03,Brahmanbaria,ব্রাহ্মণবাড়িয়া,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-03-UPZ-008,Bancharampur,বাঞ্ছারামপুর,BD-DIV-01-DIST-03,Brahmanbaria,ব্রাহ্মণবাড়িয়া,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-03-UPZ-009,Bijoynagar,বিজয়নগর,BD-DIV-01-DIST-03,Brahmanbaria,ব্রাহ্মণবাড়িয়া,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-04-UPZ-001,Rangamati Sadar,রাঙ্গামাটি সদর,BD-DIV-01-DIST-04,Rangamati,রাঙ্গামাটি,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-04-UPZ-002,Kaptai,কাপ্তাই,BD-DIV-01-DIST-04,Rangamati,রাঙ্গামাটি,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-04-UPZ-003,Kawkhali,কাউখালী,BD-DIV-01-DIST-04,Rangamati,রাঙ্গামাটি,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-04-UPZ-004,Baghaichari,বাঘাইছড়ি,BD-DIV-01-DIST-04,Rangamati,রাঙ্গামাটি,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-04-UPZ-005,Barkal,বরকল,BD-DIV-01-DIST-04,Rangamati,রাঙ্গামাটি,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-04-UPZ-006,Langadu,লংগদু,BD-DIV-01-DIST-04,Rangamati,রাঙ্গামাটি,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-04-UPZ-007,Rajasthali,রাজস্থলী,BD-DIV-01-DIST-04,Rangamati,রাঙ্গামাটি,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-04-UPZ-008,Belaichari,বিলাইছড়ি,BD-DIV-01-DIST-04,Rangamati,রাঙ্গামাটি,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-04-UPZ-009,Juraichari,জুরাছড়ি,BD-DIV-01-DIST-04,Rangamati,রাঙ্গামাটি,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-04-UPZ-010,Naniarchar,নানিয়ারচর,BD-DIV-01-DIST-04,Rangamati,রাঙ্গামাটি,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-05-UPZ-001,Noakhali Sadar,নোয়াখালী সদর,BD-DIV-01-DIST-05,Noakhali,নোয়াখালী,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-05-UPZ-002,Companiganj,কোম্পানীগঞ্জ,BD-DIV-01-DIST-05,Noakhali,নোয়াখালী,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-05-UPZ-003,Begumganj,বেগমগঞ্জ,BD-DIV-01-DIST-05,Noakhali,নোয়াখালী,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-05-UPZ-004,Hatia,হাতিয়া,BD-DIV-01-DIST-05,Noakhali,নোয়াখালী,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-05-UPZ-005,Subarnachar,সুবর্ণচর,BD-DIV-01-DIST-05,Noakhali,নোয়াখালী,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-05-UPZ-006,Kabirhat,কবিরহাট,BD-DIV-01-DIST-05,Noakhali,নোয়াখালী,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-05-UPZ-007,Senbug,সেনবাগ,BD-DIV-01-DIST-05,Noakhali,নোয়াখালী,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-05-UPZ-008,Chatkhil,চাটখিল,BD-DIV-01-DIST-05,Noakhali,নোয়াখালী,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-05-UPZ-009,Sonaimori,সোনাইমুড়ী,BD-DIV-01-DIST-05,Noakhali,নোয়াখালী,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-06-UPZ-001,Haimchar,হাইমচর,BD-DIV-01-DIST-06,Chandpur,চাঁদপুর,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-06-UPZ-002,Kachua,কচুয়া,BD-DIV-01-DIST-06,Chandpur,চাঁদপুর,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-06-UPZ-003,Shahrasti,শাহরাস্তি,BD-DIV-01-DIST-06,Chandpur,চাঁদপুর,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-06-UPZ-004,Chandpur Sadar,চাঁদপুর সদর,BD-DIV-01-DIST-06,Chandpur,চাঁদপুর,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-06-UPZ-005,Matlab South,মতলব দক্ষিণ,BD-DIV-01-DIST-06,Chandpur,চাঁদপুর,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-06-UPZ-006,Hajiganj,হাজীগঞ্জ,BD-DIV-01-DIST-06,Chandpur,চাঁদপুর,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-06-UPZ-007,Matlab North,মতলব উত্তর,BD-DIV-01-DIST-06,Chandpur,চাঁদপুর,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-06-UPZ-008,Faridgonj,ফরিদগঞ্জ,BD-DIV-01-DIST-06,Chandpur,চাঁদপুর,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-07-UPZ-001,Lakshmipur Sadar,লক্ষ্মীপুর সদর,BD-DIV-01-DIST-07,Lakshmipur,লক্ষ্মীপুর,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-07-UPZ-002,Kamalnagar,কমলনগর,BD-DIV-01-DIST-07,Lakshmipur,লক্ষ্মীপুর,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-07-UPZ-003,Raipur,রায়পুর,BD-DIV-01-DIST-07,Lakshmipur,লক্ষ্মীপুর,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-07-UPZ-004,Ramgati,রামগতি,BD-DIV-01-DIST-07,Lakshmipur,লক্ষ্মীপুর,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-07-UPZ-005,Ramganj,রামগঞ্জ,BD-DIV-01-DIST-07,Lakshmipur,লক্ষ্মীপুর,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-08-UPZ-001,Rangunia,রাঙ্গুনিয়া,BD-DIV-01-DIST-08,Chattogram,চট্টগ্রাম,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-08-UPZ-002,Sitakunda,সীতাকুন্ড,BD-DIV-01-DIST-08,Chattogram,চট্টগ্রাম,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-08-UPZ-003,Mirsharai,মীরসরাই,BD-DIV-01-DIST-08,Chattogram,চট্টগ্রাম,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-08-UPZ-004,Patiya,পটিয়া,BD-DIV-01-DIST-08,Chattogram,চট্টগ্রাম,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-08-UPZ-005,Sandwip,সন্দ্বীপ,BD-DIV-01-DIST-08,Chattogram,চট্টগ্রাম,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-08-UPZ-006,Banshkhali,বাঁশখালী,BD-DIV-01-DIST-08,Chattogram,চট্টগ্রাম,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-08-UPZ-007,Boalkhali,বোয়ালখালী,BD-DIV-01-DIST-08,Chattogram,চট্টগ্রাম,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-08-UPZ-008,Anwara,আনোয়ারা,BD-DIV-01-DIST-08,Chattogram,চট্টগ্রাম,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-08-UPZ-009,Chandanaish,চন্দনাইশ,BD-DIV-01-DIST-08,Chattogram,চট্টগ্রাম,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-08-UPZ-010,Satkania,সাতকানিয়া,BD-DIV-01-DIST-08,Chattogram,চট্টগ্রাম,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-08-UPZ-011,Lohagara,লোহাগাড়া,BD-DIV-01-DIST-08,Chattogram,চট্টগ্রাম,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-08-UPZ-012,Hathazari,হাটহাজারী,BD-DIV-01-DIST-08,Chattogram,চট্টগ্রাম,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-08-UPZ-013,Fatikchhari,ফটিকছড়ি,BD-DIV-01-DIST-08,Chattogram,চট্টগ্রাম,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-08-UPZ-014,Raozan,রাউজান,BD-DIV-01-DIST-08,Chattogram,চট্টগ্রাম,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-08-UPZ-015,Karnafuli,কর্ণফুলী,BD-DIV-01-DIST-08,Chattogram,চট্টগ্রাম,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-09-UPZ-001,Coxsbazar Sadar,কক্সবাজার সদর,BD-DIV-01-DIST-09,Coxsbazar,কক্সবাজার,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-09-UPZ-002,Chakaria,চকরিয়া,BD-DIV-01-DIST-09,Coxsbazar,কক্সবাজার,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-09-UPZ-003,Kutubdia,কুতুবদিয়া,BD-DIV-01-DIST-09,Coxsbazar,কক্সবাজার,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-09-UPZ-004,Ukhiya,উখিয়া,BD-DIV-01-DIST-09,Coxsbazar,কক্সবাজার,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-09-UPZ-005,Moheshkhali,মহেশখালী,BD-DIV-01-DIST-09,Coxsbazar,কক্সবাজার,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-09-UPZ-006,Pekua,পেকুয়া,BD-DIV-01-DIST-09,Coxsbazar,কক্সবাজার,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-09-UPZ-007,Ramu,রামু,BD-DIV-01-DIST-09,Coxsbazar,কক্সবাজার,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-09-UPZ-008,Teknaf,টেকনাফ,BD-DIV-01-DIST-09,Coxsbazar,কক্সবাজার,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-09-UPZ-009,Eidgaon,ঈদগাঁও,BD-DIV-01-DIST-09,Coxsbazar,কক্সবাজার,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-10-UPZ-001,Khagrachhari Sadar,খাগড়াছড়ি সদর,BD-DIV-01-DIST-10,Khagrachhari,খাগড়াছড়ি,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-10-UPZ-002,Dighinala,দিঘীনালা,BD-DIV-01-DIST-10,Khagrachhari,খাগড়াছড়ি,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-10-UPZ-003,Panchari,পানছড়ি,BD-DIV-01-DIST-10,Khagrachhari,খাগড়াছড়ি,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-10-UPZ-004,Laxmichhari,লক্ষীছড়ি,BD-DIV-01-DIST-10,Khagrachhari,খাগড়াছড়ি,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-10-UPZ-005,Mohalchari,মহালছড়ি,BD-DIV-01-DIST-10,Khagrachhari,খাগড়াছড়ি,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-10-UPZ-006,Manikchari,মানিকছড়ি,BD-DIV-01-DIST-10,Khagrachhari,খাগড়াছড়ি,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-10-UPZ-007,Ramgarh,রামগড়,BD-DIV-01-DIST-10,Khagrachhari,খাগড়াছড়ি,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-10-UPZ-008,Matiranga,মাটিরাঙ্গা,BD-DIV-01-DIST-10,Khagrachhari,খাগড়াছড়ি,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-10-UPZ-009,Guimara,গুইমারা,BD-DIV-01-DIST-10,Khagrachhari,খাগড়াছড়ি,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-11-UPZ-001,Bandarban Sadar,বান্দরবান সদর,BD-DIV-01-DIST-11,Bandarban,বান্দরবান,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-11-UPZ-002,Alikadam,আলীকদম,BD-DIV-01-DIST-11,Bandarban,বান্দরবান,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-11-UPZ-003,Naikhongchhari,নাইক্ষ্যংছড়ি,BD-DIV-01-DIST-11,Bandarban,বান্দরবান,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-11-UPZ-004,Rowangchhari,রোয়াংছড়ি,BD-DIV-01-DIST-11,Bandarban,বান্দরবান,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-11-UPZ-005,Lama,লামা,BD-DIV-01-DIST-11,Bandarban,বান্দরবান,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-11-UPZ-006,Ruma,রুমা,BD-DIV-01-DIST-11,Bandarban,বান্দরবান,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-01-DIST-11-UPZ-007,Thanchi,থানচি,BD-DIV-01-DIST-11,Bandarban,বান্দরবান,BD-DIV-01,Chattagram,চট্টগ্রাম
BD-DIV-02-DIST-01-UPZ-001,Belkuchi,বেলকুচি,BD-DIV-02-DIST-01,Sirajganj,সিরাজগঞ্জ,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-01-UPZ-002,Chauhali,চৌহালি,BD-DIV-02-DIST-01,Sirajganj,সিরাজগঞ্জ,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-01-UPZ-003,Kamarkhand,কামারখন্দ,BD-DIV-02-DIST-01,Sirajganj,সিরাজগঞ্জ,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-01-UPZ-004,Kazipur,কাজীপুর,BD-DIV-02-DIST-01,Sirajganj,সিরাজগঞ্জ,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-01-UPZ-005,Raigonj,রায়গঞ্জ,BD-DIV-02-DIST-01,Sirajganj,সিরাজগঞ্জ,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-01-UPZ-006,Shahjadpur,শাহজাদপুর,BD-DIV-02-DIST-01,Sirajganj,সিরাজগঞ্জ,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-01-UPZ-007,Sirajganj Sadar,সিরাজগঞ্জ সদর,BD-DIV-02-DIST-01,Sirajganj,সিরাজগঞ্জ,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-01-UPZ-008,Tarash,তাড়াশ,BD-DIV-02-DIST-01,Sirajganj,সিরাজগঞ্জ,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-01-UPZ-009,Ullapara,উল্লাপাড়া,BD-DIV-02-DIST-01,Sirajganj,সিরাজগঞ্জ,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-02-UPZ-001,Sujanagar,সুজানগর,BD-DIV-02-DIST-02,Pabna,পাবনা,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-02-UPZ-002,Ishurdi,ঈশ্বরদী,BD-DIV-02-DIST-02,Pabna,পাবনা,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-02-UPZ-003,Bhangura,ভাঙ্গুড়া,BD-DIV-02-DIST-02,Pabna,পাবনা,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-02-UPZ-004,Pabna Sadar,পাবনা সদর,BD-DIV-02-DIST-02,Pabna,পাবনা,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-02-UPZ-005,Bera,বেড়া,BD-DIV-02-DIST-02,Pabna,পাবনা,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-02-UPZ-006,Atghoria,আটঘরিয়া,BD-DIV-02-DIST-02,Pabna,পাবনা,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-02-UPZ-007,Chatmohar,চাটমোহর,BD-DIV-02-DIST-02,Pabna,পাবনা,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-02-UPZ-008,Santhia,সাঁথিয়া,BD-DIV-02-DIST-02,Pabna,পাবনা,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-02-UPZ-009,Faridpur,ফরিদপুর,BD-DIV-02-DIST-02,Pabna,পাবনা,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-03-UPZ-001,Kahaloo,কাহালু,BD-DIV-02-DIST-03,Bogura,বগুড়া,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-03-UPZ-002,Bogra Sadar,বগুড়া সদর,BD-DIV-02-DIST-03,Bogura,বগুড়া,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-03-UPZ-003,Shariakandi,সারিয়াকান্দি,BD-DIV-02-DIST-03,Bogura,বগুড়া,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-03-UPZ-004,Shajahanpur,শাজাহানপুর,BD-DIV-02-DIST-03,Bogura,বগুড়া,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-03-UPZ-005,Dupchanchia,দুপচাচিঁয়া,BD-DIV-02-DIST-03,Bogura,বগুড়া,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-03-UPZ-006,Adamdighi,আদমদিঘি,BD-DIV-02-DIST-03,Bogura,বগুড়া,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-03-UPZ-007,Nondigram,নন্দিগ্রাম,BD-DIV-02-DIST-03,Bogura,বগুড়া,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-03-UPZ-008,Sonatala,সোনাতলা,BD-DIV-02-DIST-03,Bogura,বগুড়া,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-03-UPZ-009,Dhunot,ধুনট,BD-DIV-02-DIST-03,Bogura,বগুড়া,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-03-UPZ-010,Gabtali,গাবতলী,BD-DIV-02-DIST-03,Bogura,বগুড়া,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-03-UPZ-011,Sherpur,শেরপুর,BD-DIV-02-DIST-03,Bogura,বগুড়া,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-03-UPZ-012,Shibganj,শিবগঞ্জ,BD-DIV-02-DIST-03,Bogura,বগুড়া,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-04-UPZ-001,Paba,পবা,BD-DIV-02-DIST-04,Rajshahi,রাজশাহী,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-04-UPZ-002,Durgapur,দুর্গাপুর,BD-DIV-02-DIST-04,Rajshahi,রাজশাহী,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-04-UPZ-003,Mohonpur,মোহনপুর,BD-DIV-02-DIST-04,Rajshahi,রাজশাহী,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-04-UPZ-004,Charghat,চারঘাট,BD-DIV-02-DIST-04,Rajshahi,রাজশাহী,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-04-UPZ-005,Puthia,পুঠিয়া,BD-DIV-02-DIST-04,Rajshahi,রাজশাহী,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-04-UPZ-006,Bagha,বাঘা,BD-DIV-02-DIST-04,Rajshahi,রাজশাহী,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-04-UPZ-007,Godagari,গোদাগাড়ী,BD-DIV-02-DIST-04,Rajshahi,রাজশাহী,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-04-UPZ-008,Tanore,তানোর,BD-DIV-02-DIST-04,Rajshahi,রাজশাহী,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-04-UPZ-009,Bagmara,বাগমারা,BD-DIV-02-DIST-04,Rajshahi,রাজশাহী,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-05-UPZ-001,Natore Sadar,নাটোর সদর,BD-DIV-02-DIST-05,Natore,নাটোর,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-05-UPZ-002,Singra,সিংড়া,BD-DIV-02-DIST-05,Natore,নাটোর,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-05-UPZ-003,Baraigram,বড়াইগ্রাম,BD-DIV-02-DIST-05,Natore,নাটোর,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-05-UPZ-004,Bagatipara,বাগাতিপাড়া,BD-DIV-02-DIST-05,Natore,নাটোর,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-05-UPZ-005,Lalpur,লালপুর,BD-DIV-02-DIST-05,Natore,নাটোর,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-05-UPZ-006,Gurudaspur,গুরুদাসপুর,BD-DIV-02-DIST-05,Natore,নাটোর,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-05-UPZ-007,Naldanga,নলডাঙ্গা,BD-DIV-02-DIST-05,Natore,নাটোর,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-06-UPZ-001,Akkelpur,আক্কেলপুর,BD-DIV-02-DIST-06,Joypurhat,জয়পুরহাট,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-06-UPZ-002,Kalai,কালাই,BD-DIV-02-DIST-06,Joypurhat,জয়পুরহাট,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-06-UPZ-003,Khetlal,ক্ষেতলাল,BD-DIV-02-DIST-06,Joypurhat,জয়পুরহাট,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-06-UPZ-004,Panchbibi,পাঁচবিবি,BD-DIV-02-DIST-06,Joypurhat,জয়পুরহাট,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-06-UPZ-005,Joypurhat Sadar,জয়পুরহাট সদর,BD-DIV-02-DIST-06,Joypurhat,জয়পুরহাট,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-07-UPZ-001,Chapainawabganj Sadar,চাঁপাইনবাবগঞ্জ সদর,BD-DIV-02-DIST-07,Chapainawabganj,চাঁপাইনবাবগঞ্জ,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-07-UPZ-002,Gomostapur,গোমস্তাপুর,BD-DIV-02-DIST-07,Chapainawabganj,চাঁপাইনবাবগঞ্জ,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-07-UPZ-003,Nachol,নাচোল,BD-DIV-02-DIST-07,Chapainawabganj,চাঁপাইনবাবগঞ্জ,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-07-UPZ-004,Bholahat,ভোলাহাট,BD-DIV-02-DIST-07,Chapainawabganj,চাঁপাইনবাবগঞ্জ,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-07-UPZ-005,Shibganj,শিবগঞ্জ,BD-DIV-02-DIST-07,Chapainawabganj,চাঁপাইনবাবগঞ্জ,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-08-UPZ-001,Mohadevpur,মহাদেবপুর,BD-DIV-02-DIST-08,Naogaon,নওগাঁ,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-08-UPZ-002,Badalgachi,বদলগাছী,BD-DIV-02-DIST-08,Naogaon,নওগাঁ,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-08-UPZ-003,Patnitala,পত্নিতলা,BD-DIV-02-DIST-08,Naogaon,নওগাঁ,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-08-UPZ-004,Dhamoirhat,ধামইরহাট,BD-DIV-02-DIST-08,Naogaon,নওগাঁ,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-08-UPZ-005,Niamatpur,নিয়ামতপুর,BD-DIV-02-DIST-08,Naogaon,নওগাঁ,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-08-UPZ-006,Manda,মান্দা,BD-DIV-02-DIST-08,Naogaon,নওগাঁ,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-08-UPZ-007,Atrai,আত্রাই,BD-DIV-02-DIST-08,Naogaon,নওগাঁ,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-08-UPZ-008,Raninagar,রাণীনগর,BD-DIV-02-DIST-08,Naogaon,নওগাঁ,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-08-UPZ-009,Naogaon Sadar,নওগাঁ সদর,BD-DIV-02-DIST-08,Naogaon,নওগাঁ,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-08-UPZ-010,Porsha,পোরশা,BD-DIV-02-DIST-08,Naogaon,নওগাঁ,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-02-DIST-08-UPZ-011,Sapahar,সাপাহার,BD-DIV-02-DIST-08,Naogaon,নওগাঁ,BD-DIV-02,Rajshahi,রাজশাহী
BD-DIV-03-DIST-01-UPZ-001,Manirampur,মণিরামপুর,BD-DIV-03-DIST-01,Jashore,যশোর,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-01-UPZ-002,Abhaynagar,অভয়নগর,BD-DIV-03-DIST-01,Jashore,যশোর,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-01-UPZ-003,Bagherpara,বাঘারপাড়া,BD-DIV-03-DIST-01,Jashore,যশোর,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-01-UPZ-004,Chougachha,চৌগাছা,BD-DIV-03-DIST-01,Jashore,যশোর,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-01-UPZ-005,Jhikargacha,ঝিকরগাছা,BD-DIV-03-DIST-01,Jashore,যশোর,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-01-UPZ-006,Keshabpur,কেশবপুর,BD-DIV-03-DIST-01,Jashore,যশোর,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-01-UPZ-007,Jessore Sadar,যশোর সদর,BD-DIV-03-DIST-01,Jashore,যশোর,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-01-UPZ-008,Sharsha,শার্শা,BD-DIV-03-DIST-01,Jashore,যশোর,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-02-UPZ-001,Assasuni,আশাশুনি,BD-DIV-03-DIST-02,Satkhira,সাতক্ষীরা,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-02-UPZ-002,Debhata,দেবহাটা,BD-DIV-03-DIST-02,Satkhira,সাতক্ষীরা,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-02-UPZ-003,Kalaroa,কলারোয়া,BD-DIV-03-DIST-02,Satkhira,সাতক্ষীরা,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-02-UPZ-004,Satkhira Sadar,সাতক্ষীরা সদর,BD-DIV-03-DIST-02,Satkhira,সাতক্ষীরা,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-02-UPZ-005,Shyamnagar,শ্যামনগর,BD-DIV-03-DIST-02,Satkhira,সাতক্ষীরা,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-02-UPZ-006,Tala,তালা,BD-DIV-03-DIST-02,Satkhira,সাতক্ষীরা,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-02-UPZ-007,Kaliganj,কালিগঞ্জ,BD-DIV-03-DIST-02,Satkhira,সাতক্ষীরা,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-03-UPZ-001,Mujibnagar,মুজিবনগর,BD-DIV-03-DIST-03,Meherpur,মেহেরপুর,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-03-UPZ-002,Meherpur Sadar,মেহেরপুর সদর,BD-DIV-03-DIST-03,Meherpur,মেহেরপুর,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-03-UPZ-003,Gangni,গাংনী,BD-DIV-03-DIST-03,Meherpur,মেহেরপুর,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-04-UPZ-001,Narail Sadar,নড়াইল সদর,BD-DIV-03-DIST-04,Narail,নড়াইল,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-04-UPZ-002,Lohagara,লোহাগড়া,BD-DIV-03-DIST-04,Narail,নড়াইল,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-04-UPZ-003,Kalia,কালিয়া,BD-DIV-03-DIST-04,Narail,নড়াইল,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-05-UPZ-001,Chuadanga Sadar,চুয়াডাঙ্গা সদর,BD-DIV-03-DIST-05,Chuadanga,চুয়াডাঙ্গা,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-05-UPZ-002,Alamdanga,আলমডাঙ্গা,BD-DIV-03-DIST-05,Chuadanga,চুয়াডাঙ্গা,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-05-UPZ-003,Damurhuda,দামুড়হুদা,BD-DIV-03-DIST-05,Chuadanga,চুয়াডাঙ্গা,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-05-UPZ-004,Jibannagar,জীবননগর,BD-DIV-03-DIST-05,Chuadanga,চুয়াডাঙ্গা,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-06-UPZ-001,Kushtia Sadar,কুষ্টিয়া সদর,BD-DIV-03-DIST-06,Kushtia,কুষ্টিয়া,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-06-UPZ-002,Kumarkhali,কুমারখালী,BD-DIV-03-DIST-06,Kushtia,কুষ্টিয়া,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-06-UPZ-003,Khoksa,খোকসা,BD-DIV-03-DIST-06,Kushtia,কুষ্টিয়া,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-06-UPZ-004,Mirpur,মিরপুর,BD-DIV-03-DIST-06,Kushtia,কুষ্টিয়া,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-06-UPZ-005,Daulatpur,দৌলতপুর,BD-DIV-03-DIST-06,Kushtia,কুষ্টিয়া,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-06-UPZ-006,Bheramara,ভেড়ামারা,BD-DIV-03-DIST-06,Kushtia,কুষ্টিয়া,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-07-UPZ-001,Shalikha,শালিখা,BD-DIV-03-DIST-07,Magura,মাগুরা,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-07-UPZ-002,Sreepur,শ্রীপুর,BD-DIV-03-DIST-07,Magura,মাগুরা,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-07-UPZ-003,Magura Sadar,মাগুরা সদর,BD-DIV-03-DIST-07,Magura,মাগুরা,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-07-UPZ-004,Mohammadpur,মহম্মদপুর,BD-DIV-03-DIST-07,Magura,মাগুরা,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-08-UPZ-001,Paikgasa,পাইকগাছা,BD-DIV-03-DIST-08,Khulna,খুলনা,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-08-UPZ-002,Fultola,ফুলতলা,BD-DIV-03-DIST-08,Khulna,খুলনা,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-08-UPZ-003,Digholia,দিঘলিয়া,BD-DIV-03-DIST-08,Khulna,খুলনা,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-08-UPZ-004,Rupsha,রূপসা,BD-DIV-03-DIST-08,Khulna,খুলনা,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-08-UPZ-005,Terokhada,তেরখাদা,BD-DIV-03-DIST-08,Khulna,খুলনা,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-08-UPZ-006,Dumuria,ডুমুরিয়া,BD-DIV-03-DIST-08,Khulna,খুলনা,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-08-UPZ-007,Botiaghata,বটিয়াঘাটা,BD-DIV-03-DIST-08,Khulna,খুলনা,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-08-UPZ-008,Dakop,দাকোপ,BD-DIV-03-DIST-08,Khulna,খুলনা,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-08-UPZ-009,Koyra,কয়রা,BD-DIV-03-DIST-08,Khulna,খুলনা,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-09-UPZ-001,Fakirhat,ফকিরহাট,BD-DIV-03-DIST-09,Bagerhat,বাগেরহাট,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-09-UPZ-002,Bagerhat Sadar,বাগেরহাট সদর,BD-DIV-03-DIST-09,Bagerhat,বাগেরহাট,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-09-UPZ-003,Mollahat,মোল্লাহাট,BD-DIV-03-DIST-09,Bagerhat,বাগেরহাট,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-09-UPZ-004,Sarankhola,শরণখোলা,BD-DIV-03-DIST-09,Bagerhat,বাগেরহাট,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-09-UPZ-005,Rampal,রামপাল,BD-DIV-03-DIST-09,Bagerhat,বাগেরহাট,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-09-UPZ-006,Morrelganj,মোড়েলগঞ্জ,BD-DIV-03-DIST-09,Bagerhat,বাগেরহাট,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-09-UPZ-007,Kachua,কচুয়া,BD-DIV-03-DIST-09,Bagerhat,বাগেরহাট,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-09-UPZ-008,Mongla,মোংলা,BD-DIV-03-DIST-09,Bagerhat,বাগেরহাট,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-09-UPZ-009,Chitalmari,চিতলমারী,BD-DIV-03-DIST-09,Bagerhat,বাগেরহাট,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-10-UPZ-001,Jhenaidah Sadar,ঝিনাইদহ সদর,BD-DIV-03-DIST-10,Jhenaidah,ঝিনাইদহ,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-10-UPZ-002,Shailkupa,শৈলকুপা,BD-DIV-03-DIST-10,Jhenaidah,ঝিনাইদহ,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-10-UPZ-003,Harinakundu,হরিণাকুন্ডু,BD-DIV-03-DIST-10,Jhenaidah,ঝিনাইদহ,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-10-UPZ-004,Kaliganj,কালীগঞ্জ,BD-DIV-03-DIST-10,Jhenaidah,ঝিনাইদহ,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-10-UPZ-005,Kotchandpur,কোটচাঁদপুর,BD-DIV-03-DIST-10,Jhenaidah,ঝিনাইদহ,BD-DIV-03,Khulna,খুলনা
BD-DIV-03-DIST-10-UPZ-006,Moheshpur,মহেশপুর,BD-DIV-03-DIST-10,Jhenaidah,ঝিনাইদহ,BD-DIV-03,Khulna,খুলনা
BD-DIV-04-DIST-01-UPZ-001,Jhalakathi Sadar,ঝালকাঠি সদর,BD-DIV-04-DIST-01,Jhalakathi,ঝালকাঠি,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-01-UPZ-002,Kathalia,কাঠালিয়া,BD-DIV-04-DIST-01,Jhalakathi,ঝালকাঠি,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-01-UPZ-003,Nalchity,নলছিটি,BD-DIV-04-DIST-01,Jhalakathi,ঝালকাঠি,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-01-UPZ-004,Rajapur,রাজাপুর,BD-DIV-04-DIST-01,Jhalakathi,ঝালকাঠি,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-02-UPZ-001,Bauphal,বাউফল,BD-DIV-04-DIST-02,Patuakhali,পটুয়াখালী,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-02-UPZ-002,Patuakhali Sadar,পটুয়াখালী সদর,BD-DIV-04-DIST-02,Patuakhali,পটুয়াখালী,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-02-UPZ-003,Dumki,দুমকি,BD-DIV-04-DIST-02,Patuakhali,পটুয়াখালী,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-02-UPZ-004,Dashmina,দশমিনা,BD-DIV-04-DIST-02,Patuakhali,পটুয়াখালী,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-02-UPZ-005,Kalapara,কলাপাড়া,BD-DIV-04-DIST-02,Patuakhali,পটুয়াখালী,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-02-UPZ-006,Mirzaganj,মির্জাগঞ্জ,BD-DIV-04-DIST-02,Patuakhali,পটুয়াখালী,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-02-UPZ-007,Galachipa,গলাচিপা,BD-DIV-04-DIST-02,Patuakhali,পটুয়াখালী,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-02-UPZ-008,Rangabali,রাঙ্গাবালী,BD-DIV-04-DIST-02,Patuakhali,পটুয়াখালী,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-03-UPZ-001,Pirojpur Sadar,পিরোজপুর সদর,BD-DIV-04-DIST-03,Pirojpur,পিরোজপুর,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-03-UPZ-002,Nazirpur,নাজিরপুর,BD-DIV-04-DIST-03,Pirojpur,পিরোজপুর,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-03-UPZ-003,Kawkhali,কাউখালী,BD-DIV-04-DIST-03,Pirojpur,পিরোজপুর,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-03-UPZ-004,Indurkani,ইন্দুরকানী,BD-DIV-04-DIST-03,Pirojpur,পিরোজপুর,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-03-UPZ-005,Bhandaria,ভান্ডারিয়া,BD-DIV-04-DIST-03,Pirojpur,পিরোজপুর,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-03-UPZ-006,Mathbaria,মঠবাড়ীয়া,BD-DIV-04-DIST-03,Pirojpur,পিরোজপুর,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-03-UPZ-007,Nesarabad,নেছারাবাদ,BD-DIV-04-DIST-03,Pirojpur,পিরোজপুর,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-04-UPZ-001,Barisal Sadar,বরিশাল সদর,BD-DIV-04-DIST-04,Barisal,বরিশাল,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-04-UPZ-002,Bakerganj,বাকেরগঞ্জ,BD-DIV-04-DIST-04,Barisal,বরিশাল,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-04-UPZ-003,Babuganj,বাবুগঞ্জ,BD-DIV-04-DIST-04,Barisal,বরিশাল,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-04-UPZ-004,Wazirpur,উজিরপুর,BD-DIV-04-DIST-04,Barisal,বরিশাল,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-04-UPZ-005,Banaripara,বানারীপাড়া,BD-DIV-04-DIST-04,Barisal,বরিশাল,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-04-UPZ-006,Gournadi,গৌরনদী,BD-DIV-04-DIST-04,Barisal,বরিশাল,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-04-UPZ-007,Agailjhara,আগৈলঝাড়া,BD-DIV-04-DIST-04,Barisal,বরিশাল,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-04-UPZ-008,Mehendiganj,মেহেন্দিগঞ্জ,BD-DIV-04-DIST-04,Barisal,বরিশাল,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-04-UPZ-009,Muladi,মুলাদী,BD-DIV-04-DIST-04,Barisal,বরিশাল,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-04-UPZ-010,Hizla,হিজলা,BD-DIV-04-DIST-04,Barisal,বরিশাল,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-05-UPZ-001,Bhola Sadar,ভোলা সদর,BD-DIV-04-DIST-05,Bhola,ভোলা,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-05-UPZ-002,Borhanuddin,বোরহানউদ্দিন,BD-DIV-04-DIST-05,Bhola,ভোলা,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-05-UPZ-003,Charfesson,চরফ্যাশন,BD-DIV-04-DIST-05,Bhola,ভোলা,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-05-UPZ-004,Doulatkhan,দৌলতখান,BD-DIV-04-DIST-05,Bhola,ভোলা,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-05-UPZ-005,Monpura,মনপুরা,BD-DIV-04-DIST-05,Bhola,ভোলা,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-05-UPZ-006,Tazumuddin,তজুমদ্দিন,BD-DIV-04-DIST-05,Bhola,ভোলা,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-05-UPZ-007,Lalmohan,লালমোহন,BD-DIV-04-DIST-05,Bhola,ভোলা,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-06-UPZ-001,Amtali,আমতলী,BD-DIV-04-DIST-06,Barguna,বরগুনা,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-06-UPZ-002,Barguna Sadar,বরগুনা সদর,BD-DIV-04-DIST-06,Barguna,বরগুনা,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-06-UPZ-003,Betagi,বেতাগী,BD-DIV-04-DIST-06,Barguna,বরগুনা,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-06-UPZ-004,Bamna,বামনা,BD-DIV-04-DIST-06,Barguna,বরগুনা,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-06-UPZ-005,Pathorghata,পাথরঘাটা,BD-DIV-04-DIST-06,Barguna,বরগুনা,BD-DIV-04,Barisal,বরিশাল
BD-DIV-04-DIST-06-UPZ-006,Taltali,তালতলি,BD-DIV-04-DIST-06,Barguna,বরগুনা,BD-DIV-04,Barisal,বরিশাল
BD-DIV-05-DIST-01-UPZ-001,Balaganj,বালাগঞ্জ,BD-DIV-05-DIST-01,Sylhet,সিলেট,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-01-UPZ-002,Beanibazar,বিয়ানীবাজার,BD-DIV-05-DIST-01,Sylhet,সিলেট,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-01-UPZ-003,Bishwanath,বিশ্বনাথ,BD-DIV-05-DIST-01,Sylhet,সিলেট,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-01-UPZ-004,Companiganj,কোম্পানীগঞ্জ,BD-DIV-05-DIST-01,Sylhet,সিলেট,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-01-UPZ-005,Fenchuganj,ফেঞ্চুগঞ্জ,BD-DIV-05-DIST-01,Sylhet,সিলেট,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-01-UPZ-006,Golapganj,গোলাপগঞ্জ,BD-DIV-05-DIST-01,Sylhet,সিলেট,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-01-UPZ-007,Gowainghat,গোয়াইনঘাট,BD-DIV-05-DIST-01,Sylhet,সিলেট,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-01-UPZ-008,Jaintiapur,জৈন্তাপুর,BD-DIV-05-DIST-01,Sylhet,সিলেট,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-01-UPZ-009,Kanaighat,কানাইঘাট,BD-DIV-05-DIST-01,Sylhet,সিলেট,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-01-UPZ-010,Sylhet Sadar,সিলেট সদর,BD-DIV-05-DIST-01,Sylhet,সিলেট,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-01-UPZ-011,Zakiganj,জকিগঞ্জ,BD-DIV-05-DIST-01,Sylhet,সিলেট,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-01-UPZ-012,Dakshinsurma,দক্ষিণ সুরমা,BD-DIV-05-DIST-01,Sylhet,সিলেট,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-01-UPZ-013,Osmaninagar,ওসমানী নগর,BD-DIV-05-DIST-01,Sylhet,সিলেট,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-02-UPZ-001,Barlekha,বড়লেখা,BD-DIV-05-DIST-02,Moulvibazar,মৌলভীবাজার,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-02-UPZ-002,Kamolganj,কমলগঞ্জ,BD-DIV-05-DIST-02,Moulvibazar,মৌলভীবাজার,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-02-UPZ-003,Kulaura,কুলাউড়া,BD-DIV-05-DIST-02,Moulvibazar,মৌলভীবাজার,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-02-UPZ-004,Moulvibazar Sadar,মৌলভীবাজার সদর,BD-DIV-05-DIST-02,Moulvibazar,মৌলভীবাজার,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-02-UPZ-005,Rajnagar,রাজনগর,BD-DIV-05-DIST-02,Moulvibazar,মৌলভীবাজার,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-02-UPZ-006,Sreemangal,শ্রীমঙ্গল,BD-DIV-05-DIST-02,Moulvibazar,মৌলভীবাজার,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-02-UPZ-007,Juri,জুড়ী,BD-DIV-05-DIST-02,Moulvibazar,মৌলভীবাজার,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-03-UPZ-001,Nabiganj,নবীগঞ্জ,BD-DIV-05-DIST-03,Habiganj,হবিগঞ্জ,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-03-UPZ-002,Bahubal,বাহুবল,BD-DIV-05-DIST-03,Habiganj,হবিগঞ্জ,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-03-UPZ-003,Ajmiriganj,আজমিরীগঞ্জ,BD-DIV-05-DIST-03,Habiganj,হবিগঞ্জ,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-03-UPZ-004,Baniachong,বানিয়াচং,BD-DIV-05-DIST-03,Habiganj,হবিগঞ্জ,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-03-UPZ-005,Lakhai,লাখাই,BD-DIV-05-DIST-03,Habiganj,হবিগঞ্জ,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-03-UPZ-006,Chunarughat,চুনারুঘাট,BD-DIV-05-DIST-03,Habiganj,হবিগঞ্জ,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-03-UPZ-007,Habiganj Sadar,হবিগঞ্জ সদর,BD-DIV-05-DIST-03,Habiganj,হবিগঞ্জ,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-03-UPZ-008,Madhabpur,মাধবপুর,BD-DIV-05-DIST-03,Habiganj,হবিগঞ্জ,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-03-UPZ-009,Shaistaganj,শায়েস্তাগঞ্জ,BD-DIV-05-DIST-03,Habiganj,হবিগঞ্জ,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-04-UPZ-001,Sunamganj Sadar,সুনামগঞ্জ সদর,BD-DIV-05-DIST-04,Sunamganj,সুনামগঞ্জ,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-04-UPZ-002,Shantiganj,শান্তিগঞ্জ,BD-DIV-05-DIST-04,Sunamganj,সুনামগঞ্জ,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-04-UPZ-003,Bishwambarpur,বিশ্বম্ভরপুর,BD-DIV-05-DIST-04,Sunamganj,সুনামগঞ্জ,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-04-UPZ-004,Chhatak,ছাতক,BD-DIV-05-DIST-04,Sunamganj,সুনামগঞ্জ,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-04-UPZ-005,Jagannathpur,জগন্নাথপুর,BD-DIV-05-DIST-04,Sunamganj,সুনামগঞ্জ,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-04-UPZ-006,Dowarabazar,দোয়ারাবাজার,BD-DIV-05-DIST-04,Sunamganj,সুনামগঞ্জ,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-04-UPZ-007,Tahirpur,তাহিরপুর,BD-DIV-05-DIST-04,Sunamganj,সুনামগঞ্জ,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-04-UPZ-008,Dharmapasha,ধর্মপাশা,BD-DIV-05-DIST-04,Sunamganj,সুনামগঞ্জ,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-04-UPZ-009,Jamalganj,জামালগঞ্জ,BD-DIV-05-DIST-04,Sunamganj,সুনামগঞ্জ,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-04-UPZ-010,Shalla,শাল্লা,BD-DIV-05-DIST-04,Sunamganj,সুনামগঞ্জ,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-04-UPZ-011,Derai,দিরাই,BD-DIV-05-DIST-04,Sunamganj,সুনামগঞ্জ,BD-DIV-05,Sylhet,সিলেট
BD-DIV-05-DIST-04-UPZ-012,Madhyanagar,মধ্যনগর,BD-DIV-05-DIST-04,Sunamganj,সুনামগঞ্জ,BD-DIV-05,Sylhet,সিলেট
BD-DIV-06-DIST-01-UPZ-001,Belabo,বেলাবো,BD-DIV-06-DIST-01,Narsingdi,নরসিংদী,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-01-UPZ-002,Monohardi,মনোহরদী,BD-DIV-06-DIST-01,Narsingdi,নরসিংদী,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-01-UPZ-003,Narsingdi Sadar,নরসিংদী সদর,BD-DIV-06-DIST-01,Narsingdi,নরসিংদী,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-01-UPZ-004,Palash,পলাশ,BD-DIV-06-DIST-01,Narsingdi,নরসিংদী,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-01-UPZ-005,Raipura,রায়পুরা,BD-DIV-06-DIST-01,Narsingdi,নরসিংদী,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-01-UPZ-006,Shibpur,শিবপুর,BD-DIV-06-DIST-01,Narsingdi,নরসিংদী,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-02-UPZ-001,Kaliganj,কালীগঞ্জ,BD-DIV-06-DIST-02,Gazipur,গাজীপুর,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-02-UPZ-002,Kaliakair,কালিয়াকৈর,BD-DIV-06-DIST-02,Gazipur,গাজীপুর,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-02-UPZ-003,Kapasia,কাপাসিয়া,BD-DIV-06-DIST-02,Gazipur,গাজীপুর,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-02-UPZ-004,Gazipur Sadar,গাজীপুর সদর,BD-DIV-06-DIST-02,Gazipur,গাজীপুর,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-02-UPZ-005,Sreepur,শ্রীপুর,BD-DIV-06-DIST-02,Gazipur,গাজীপুর,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-03-UPZ-001,Shariatpur Sadar,শরিয়তপুর সদর,BD-DIV-06-DIST-03,Shariatpur,শরীয়তপুর,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-03-UPZ-002,Naria,নড়িয়া,BD-DIV-06-DIST-03,Shariatpur,শরীয়তপুর,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-03-UPZ-003,Zajira,জাজিরা,BD-DIV-06-DIST-03,Shariatpur,শরীয়তপুর,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-03-UPZ-004,Gosairhat,গোসাইরহাট,BD-DIV-06-DIST-03,Shariatpur,শরীয়তপুর,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-03-UPZ-005,Bhedarganj,ভেদরগঞ্জ,BD-DIV-06-DIST-03,Shariatpur,শরীয়তপুর,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-03-UPZ-006,Damudya,ডামুড্যা,BD-DIV-06-DIST-03,Shariatpur,শরীয়তপুর,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-04-UPZ-001,Araihazar,আড়াইহাজার,BD-DIV-06-DIST-04,Narayanganj,নারায়ণগঞ্জ,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-04-UPZ-002,Bandar,বন্দর,BD-DIV-06-DIST-04,Narayanganj,নারায়ণগঞ্জ,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-04-UPZ-003,Narayanganj Sadar,নারায়নগঞ্জ সদর,BD-DIV-06-DIST-04,Narayanganj,নারায়ণগঞ্জ,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-04-UPZ-004,Rupganj,রূপগঞ্জ,BD-DIV-06-DIST-04,Narayanganj,নারায়ণগঞ্জ,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-04-UPZ-005,Sonargaon,সোনারগাঁ,BD-DIV-06-DIST-04,Narayanganj,নারায়ণগঞ্জ,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-05-UPZ-001,Basail,বাসাইল,BD-DIV-06-DIST-05,Tangail,টাঙ্গাইল,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-05-UPZ-002,Bhuapur,ভুয়াপুর,BD-DIV-06-DIST-05,Tangail,টাঙ্গাইল,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-05-UPZ-003,Delduar,দেলদুয়ার,BD-DIV-06-DIST-05,Tangail,টাঙ্গাইল,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-05-UPZ-004,Ghatail,ঘাটাইল,BD-DIV-06-DIST-05,Tangail,টাঙ্গাইল,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-05-UPZ-005,Gopalpur,গোপালপুর,BD-DIV-06-DIST-05,Tangail,টাঙ্গাইল,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-05-UPZ-006,Madhupur,মধুপুর,BD-DIV-06-DIST-05,Tangail,টাঙ্গাইল,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-05-UPZ-007,Mirzapur,মির্জাপুর,BD-DIV-06-DIST-05,Tangail,টাঙ্গাইল,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-05-UPZ-008,Nagarpur,নাগরপুর,BD-DIV-06-DIST-05,Tangail,টাঙ্গাইল,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-05-UPZ-009,Sakhipur,সখিপুর,BD-DIV-06-DIST-05,Tangail,টাঙ্গাইল,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-05-UPZ-010,Tangail Sadar,টাঙ্গাইল সদর,BD-DIV-06-DIST-05,Tangail,টাঙ্গাইল,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-05-UPZ-011,Kalihati,কালিহাতী,BD-DIV-06-DIST-05,Tangail,টাঙ্গাইল,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-05-UPZ-012,Dhanbari,ধনবাড়ী,BD-DIV-06-DIST-05,Tangail,টাঙ্গাইল,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-06-UPZ-001,Itna,ইটনা,BD-DIV-06-DIST-06,Kishoreganj,কিশোরগঞ্জ,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-06-UPZ-002,Katiadi,কটিয়াদী,BD-DIV-06-DIST-06,Kishoreganj,কিশোরগঞ্জ,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-06-UPZ-003,Bhairab,ভৈরব,BD-DIV-06-DIST-06,Kishoreganj,কিশোরগঞ্জ,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-06-UPZ-004,Tarail,তাড়াইল,BD-DIV-06-DIST-06,Kishoreganj,কিশোরগঞ্জ,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-06-UPZ-005,Hossainpur,হোসেনপুর,BD-DIV-06-DIST-06,Kishoreganj,কিশোরগঞ্জ,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-06-UPZ-006,Pakundia,পাকুন্দিয়া,BD-DIV-06-DIST-06,Kishoreganj,কিশোরগঞ্জ,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-06-UPZ-007,Kuliarchar,কুলিয়ারচর,BD-DIV-06-DIST-06,Kishoreganj,কিশোরগঞ্জ,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-06-UPZ-008,Kishoreganj Sadar,কিশোরগঞ্জ সদর,BD-DIV-06-DIST-06,Kishoreganj,কিশোরগঞ্জ,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-06-UPZ-009,Karimgonj,করিমগঞ্জ,BD-DIV-06-DIST-06,Kishoreganj,কিশোরগঞ্জ,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-06-UPZ-010,Bajitpur,বাজিতপুর,BD-DIV-06-DIST-06,Kishoreganj,কিশোরগঞ্জ,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-06-UPZ-011,Austagram,অষ্টগ্রাম,BD-DIV-06-DIST-06,Kishoreganj,কিশোরগঞ্জ,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-06-UPZ-012,Mithamoin,মিঠামইন,BD-DIV-06-DIST-06,Kishoreganj,কিশোরগঞ্জ,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-06-UPZ-013,Nikli,নিকলী,BD-DIV-06-DIST-06,Kishoreganj,কিশোরগঞ্জ,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-07-UPZ-001,Harirampur,হরিরামপুর,BD-DIV-06-DIST-07,Manikganj,মানিকগঞ্জ,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-07-UPZ-002,Saturia,সাটুরিয়া,BD-DIV-06-DIST-07,Manikganj,মানিকগঞ্জ,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-07-UPZ-003,Manikganj Sadar,মানিকগঞ্জ সদর,BD-DIV-06-DIST-07,Manikganj,মানিকগঞ্জ,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-07-UPZ-004,Gior,ঘিওর,BD-DIV-06-DIST-07,Manikganj,মানিকগঞ্জ,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-07-UPZ-005,Shibaloy,শিবালয়,BD-DIV-06-DIST-07,Manikganj,মানিকগঞ্জ,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-07-UPZ-006,Doulatpur,দৌলতপুর,BD-DIV-06-DIST-07,Manikganj,মানিকগঞ্জ,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-07-UPZ-007,Singiar,সিংগাইর,BD-DIV-06-DIST-07,Manikganj,মানিকগঞ্জ,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-08-UPZ-001,Savar,সাভার,BD-DIV-06-DIST-08,Dhaka,ঢাকা,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-08-UPZ-002,Dhamrai,ধামরাই,BD-DIV-06-DIST-08,Dhaka,ঢাকা,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-08-UPZ-003,Keraniganj,কেরাণীগঞ্জ,BD-DIV-06-DIST-08,Dhaka,ঢাকা,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-08-UPZ-004,Nawabganj,নবাবগঞ্জ,BD-DIV-06-DIST-08,Dhaka,ঢাকা,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-08-UPZ-005,Dohar,দোহার,BD-DIV-06-DIST-08,Dhaka,ঢাকা,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-09-UPZ-001,Munshiganj Sadar,মুন্সিগঞ্জ সদর,BD-DIV-06-DIST-09,Munshiganj,মুন্সিগঞ্জ,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-09-UPZ-002,Sreenagar,শ্রীনগর,BD-DIV-06-DIST-09,Munshiganj,মুন্সিগঞ্জ,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-09-UPZ-003,Sirajdikhan,সিরাজদিখান,BD-DIV-06-DIST-09,Munshiganj,মুন্সিগঞ্জ,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-09-UPZ-004,Louhajanj,লৌহজং,BD-DIV-06-DIST-09,Munshiganj,মুন্সিগঞ্জ,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-09-UPZ-005,Gajaria,গজারিয়া,BD-DIV-06-DIST-09,Munshiganj,মুন্সিগঞ্জ,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-09-UPZ-006,Tongibari,টংগীবাড়ি,BD-DIV-06-DIST-09,Munshiganj,মুন্সিগঞ্জ,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-10-UPZ-001,Rajbari Sadar,রাজবাড়ী সদর,BD-DIV-06-DIST-10,Rajbari,রাজবাড়ী,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-10-UPZ-002,Goalanda,গোয়ালন্দ,BD-DIV-06-DIST-10,Rajbari,রাজবাড়ী,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-10-UPZ-003,Pangsa,পাংশা,BD-DIV-06-DIST-10,Rajbari,রাজবাড়ী,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-10-UPZ-004,Baliakandi,বালিয়াকান্দি,BD-DIV-06-DIST-10,Rajbari,রাজবাড়ী,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-10-UPZ-005,Kalukhali,কালুখালী,BD-DIV-06-DIST-10,Rajbari,রাজবাড়ী,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-11-UPZ-001,Madaripur Sadar,মাদারীপুর সদর,BD-DIV-06-DIST-11,Madaripur,মাদারীপুর,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-11-UPZ-002,Shibchar,শিবচর,BD-DIV-06-DIST-11,Madaripur,মাদারীপুর,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-11-UPZ-003,Kalkini,কালকিনি,BD-DIV-06-DIST-11,Madaripur,মাদারীপুর,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-11-UPZ-004,Rajoir,রাজৈর,BD-DIV-06-DIST-11,Madaripur,মাদারীপুর,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-11-UPZ-005,Dasar,ডাসার,BD-DIV-06-DIST-11,Madaripur,মাদারীপুর,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-12-UPZ-001,Gopalganj Sadar,গোপালগঞ্জ সদর,BD-DIV-06-DIST-12,Gopalganj,গোপালগঞ্জ,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-12-UPZ-002,Kashiani,কাশিয়ানী,BD-DIV-06-DIST-12,Gopalganj,গোপালগঞ্জ,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-12-UPZ-003,Tungipara,টুংগীপাড়া,BD-DIV-06-DIST-12,Gopalganj,গোপালগঞ্জ,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-12-UPZ-004,Kotalipara,কোটালীপাড়া,BD-DIV-06-DIST-12,Gopalganj,গোপালগঞ্জ,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-12-UPZ-005,Muksudpur,মুকসুদপুর,BD-DIV-06-DIST-12,Gopalganj,গোপালগঞ্জ,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-13-UPZ-001,Faridpur Sadar,ফরিদপুর সদর,BD-DIV-06-DIST-13,Faridpur,ফরিদপুর,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-13-UPZ-002,Alfadanga,আলফাডাঙ্গা,BD-DIV-06-DIST-13,Faridpur,ফরিদপুর,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-13-UPZ-003,Boalmari,বোয়ালমারী,BD-DIV-06-DIST-13,Faridpur,ফরিদপুর,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-13-UPZ-004,Sadarpur,সদরপুর,BD-DIV-06-DIST-13,Faridpur,ফরিদপুর,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-13-UPZ-005,Nagarkanda,নগরকান্দা,BD-DIV-06-DIST-13,Faridpur,ফরিদপুর,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-13-UPZ-006,Bhanga,ভাঙ্গা,BD-DIV-06-DIST-13,Faridpur,ফরিদপুর,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-13-UPZ-007,Charbhadrasan,চরভদ্রাসন,BD-DIV-06-DIST-13,Faridpur,ফরিদপুর,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-13-UPZ-008,Madhukhali,মধুখালী,BD-DIV-06-DIST-13,Faridpur,ফরিদপুর,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-06-DIST-13-UPZ-009,Saltha,সালথা,BD-DIV-06-DIST-13,Faridpur,ফরিদপুর,BD-DIV-06,Dhaka,ঢাকা
BD-DIV-07-DIST-01-UPZ-001,Panchagarh Sadar,পঞ্চগড় সদর,BD-DIV-07-DIST-01,Panchagarh,পঞ্চগড়,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-01-UPZ-002,Debiganj,দেবীগঞ্জ,BD-DIV-07-DIST-01,Panchagarh,পঞ্চগড়,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-01-UPZ-003,Boda,বোদা,BD-DIV-07-DIST-01,Panchagarh,পঞ্চগড়,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-01-UPZ-004,Atwari,আটোয়ারী,BD-DIV-07-DIST-01,Panchagarh,পঞ্চগড়,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-01-UPZ-005,Tetulia,তেতুলিয়া,BD-DIV-07-DIST-01,Panchagarh,পঞ্চগড়,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-02-UPZ-001,Nawabganj,নবাবগঞ্জ,BD-DIV-07-DIST-02,Dinajpur,দিনাজপুর,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-02-UPZ-002,Birganj,বীরগঞ্জ,BD-DIV-07-DIST-02,Dinajpur,দিনাজপুর,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-02-UPZ-003,Ghoraghat,ঘোড়াঘাট,BD-DIV-07-DIST-02,Dinajpur,দিনাজপুর,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-02-UPZ-004,Birampur,বিরামপুর,BD-DIV-07-DIST-02,Dinajpur,দিনাজপুর,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-02-UPZ-005,Parbatipur,পার্বতীপুর,BD-DIV-07-DIST-02,Dinajpur,দিনাজপুর,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-02-UPZ-006,Bochaganj,বোচাগঞ্জ,BD-DIV-07-DIST-02,Dinajpur,দিনাজপুর,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-02-UPZ-007,Kaharol,কাহারোল,BD-DIV-07-DIST-02,Dinajpur,দিনাজপুর,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-02-UPZ-008,Fulbari,ফুলবাড়ী,BD-DIV-07-DIST-02,Dinajpur,দিনাজপুর,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-02-UPZ-009,Dinajpur Sadar,দিনাজপুর সদর,BD-DIV-07-DIST-02,Dinajpur,দিনাজপুর,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-02-UPZ-010,Hakimpur,হাকিমপুর,BD-DIV-07-DIST-02,Dinajpur,দিনাজপুর,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-02-UPZ-011,Khansama,খানসামা,BD-DIV-07-DIST-02,Dinajpur,দিনাজপুর,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-02-UPZ-012,Birol,বিরল,BD-DIV-07-DIST-02,Dinajpur,দিনাজপুর,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-02-UPZ-013,Chirirbandar,চিরিরবন্দর,BD-DIV-07-DIST-02,Dinajpur,দিনাজপুর,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-03-UPZ-001,Lalmonirhat Sadar,লালমনিরহাট সদর,BD-DIV-07-DIST-03,Lalmonirhat,লালমনিরহাট,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-03-UPZ-002,Kaliganj,কালীগঞ্জ,BD-DIV-07-DIST-03,Lalmonirhat,লালমনিরহাট,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-03-UPZ-003,Hatibandha,হাতীবান্ধা,BD-DIV-07-DIST-03,Lalmonirhat,লালমনিরহাট,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-03-UPZ-004,Patgram,পাটগ্রাম,BD-DIV-07-DIST-03,Lalmonirhat,লালমনিরহাট,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-03-UPZ-005,Aditmari,আদিতমারী,BD-DIV-07-DIST-03,Lalmonirhat,লালমনিরহাট,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-04-UPZ-001,Syedpur,সৈয়দপুর,BD-DIV-07-DIST-04,Nilphamari,নীলফামারী,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-04-UPZ-002,Domar,ডোমার,BD-DIV-07-DIST-04,Nilphamari,নীলফামারী,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-04-UPZ-003,Dimla,ডিমলা,BD-DIV-07-DIST-04,Nilphamari,নীলফামারী,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-04-UPZ-004,Jaldhaka,জলঢাকা,BD-DIV-07-DIST-04,Nilphamari,নীলফামারী,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-04-UPZ-005,Kishorganj,কিশোরগঞ্জ,BD-DIV-07-DIST-04,Nilphamari,নীলফামারী,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-04-UPZ-006,Nilphamari Sadar,নীলফামারী সদর,BD-DIV-07-DIST-04,Nilphamari,নীলফামারী,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-05-UPZ-001,Sadullapur,সাদুল্লাপুর,BD-DIV-07-DIST-05,Gaibandha,গাইবান্ধা,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-05-UPZ-002,Gaibandha Sadar,গাইবান্ধা সদর,BD-DIV-07-DIST-05,Gaibandha,গাইবান্ধা,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-05-UPZ-003,Palashbari,পলাশবাড়ী,BD-DIV-07-DIST-05,Gaibandha,গাইবান্ধা,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-05-UPZ-004,Saghata,সাঘাটা,BD-DIV-07-DIST-05,Gaibandha,গাইবান্ধা,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-05-UPZ-005,Gobindaganj,গোবিন্দগঞ্জ,BD-DIV-07-DIST-05,Gaibandha,গাইবান্ধা,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-05-UPZ-006,Sundarganj,সুন্দরগঞ্জ,BD-DIV-07-DIST-05,Gaibandha,গাইবান্ধা,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-05-UPZ-007,Phulchari,ফুলছড়ি,BD-DIV-07-DIST-05,Gaibandha,গাইবান্ধা,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-06-UPZ-001,Thakurgaon Sadar,ঠাকুরগাঁও সদর,BD-DIV-07-DIST-06,Thakurgaon,ঠাকুরগাঁও,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-06-UPZ-002,Pirganj,পীরগঞ্জ,BD-DIV-07-DIST-06,Thakurgaon,ঠাকুরগাঁও,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-06-UPZ-003,Ranisankail,রাণীশংকৈল,BD-DIV-07-DIST-06,Thakurgaon,ঠাকুরগাঁও,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-06-UPZ-004,Haripur,হরিপুর,BD-DIV-07-DIST-06,Thakurgaon,ঠাকুরগাঁও,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-06-UPZ-005,Baliadangi,বালিয়াডাঙ্গী,BD-DIV-07-DIST-06,Thakurgaon,ঠাকুরগাঁও,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-07-UPZ-001,Rangpur Sadar,রংপুর সদর,BD-DIV-07-DIST-07,Rangpur,রংপুর,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-07-UPZ-002,Gangachara,গংগাচড়া,BD-DIV-07-DIST-07,Rangpur,রংপুর,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-07-UPZ-003,Taragonj,তারাগঞ্জ,BD-DIV-07-DIST-07,Rangpur,রংপুর,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-07-UPZ-004,Badargonj,বদরগঞ্জ,BD-DIV-07-DIST-07,Rangpur,রংপুর,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-07-UPZ-005,Mithapukur,মিঠাপুকুর,BD-DIV-07-DIST-07,Rangpur,রংপুর,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-07-UPZ-006,Pirgonj,পীরগঞ্জ,BD-DIV-07-DIST-07,Rangpur,রংপুর,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-07-UPZ-007,Kaunia,কাউনিয়া,BD-DIV-07-DIST-07,Rangpur,রংপুর,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-07-UPZ-008,Pirgacha,পীরগাছা,BD-DIV-07-DIST-07,Rangpur,রংপুর,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-08-UPZ-001,Kurigram Sadar,কুড়িগ্রাম সদর,BD-DIV-07-DIST-08,Kurigram,কুড়িগ্রাম,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-08-UPZ-002,Nageshwari,নাগেশ্বরী,BD-DIV-07-DIST-08,Kurigram,কুড়িগ্রাম,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-08-UPZ-003,Bhurungamari,ভুরুঙ্গামারী,BD-DIV-07-DIST-08,Kurigram,কুড়িগ্রাম,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-08-UPZ-004,Phulbari,ফুলবাড়ী,BD-DIV-07-DIST-08,Kurigram,কুড়িগ্রাম,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-08-UPZ-005,Rajarhat,রাজারহাট,BD-DIV-07-DIST-08,Kurigram,কুড়িগ্রাম,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-08-UPZ-006,Ulipur,উলিপুর,BD-DIV-07-DIST-08,Kurigram,কুড়িগ্রাম,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-08-UPZ-007,Chilmari,চিলমারী,BD-DIV-07-DIST-08,Kurigram,কুড়িগ্রাম,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-08-UPZ-008,Rowmari,রৌমারী,BD-DIV-07-DIST-08,Kurigram,কুড়িগ্রাম,BD-DIV-07,Rangpur,রংপুর
BD-DIV-07-DIST-08-UPZ-009,Charrajibpur,চর রাজিবপুর,BD-DIV-07-DIST-08,Kurigram,কুড়িগ্রাম,BD-DIV-07,Rangpur,রংপুর
BD-DIV-08-DIST-01-UPZ-001,Sherpur Sadar,শেরপুর সদর,BD-DIV-08-DIST-01,Sherpur,শেরপুর,BD-DIV-08,Mymensingh,ময়মনসিংহ
BD-DIV-08-DIST-01-UPZ-002,Nalitabari,নালিতাবাড়ী,BD-DIV-08-DIST-01,Sherpur,শেরপুর,BD-DIV-08,Mymensingh,ময়মনসিংহ
BD-DIV-08-DIST-01-UPZ-003,Sreebordi,শ্রীবরদী,BD-DIV-08-DIST-01,Sherpur,শেরপুর,BD-DIV-08,Mymensingh,ময়মনসিংহ
BD-DIV-08-DIST-01-UPZ-004,Nokla,নকলা,BD-DIV-08-DIST-01,Sherpur,শেরপুর,BD-DIV-08,Mymensingh,ময়মনসিংহ
BD-DIV-08-DIST-01-UPZ-005,Jhenaigati,ঝিনাইগাতী,BD-DIV-08-DIST-01,Sherpur,শেরপুর,BD-DIV-08,Mymensingh,ময়মনসিংহ
BD-DIV-08-DIST-02-UPZ-001,Fulbaria,ফুলবাড়ীয়া,BD-DIV-08-DIST-02,Mymensingh,ময়মনসিংহ,BD-DIV-08,Mymensingh,ময়মনসিংহ
BD-DIV-08-DIST-02-UPZ-002,Trishal,ত্রিশাল,BD-DIV-08-DIST-02,Mymensingh,ময়মনসিংহ,BD-DIV-08,Mymensingh,ময়মনসিংহ
BD-DIV-08-DIST-02-UPZ-003,Bhaluka,ভালুকা,BD-DIV-08-DIST-02,Mymensingh,ময়মনসিংহ,BD-DIV-08,Mymensingh,ময়মনসিংহ
BD-DIV-08-DIST-02-UPZ-004,Muktagacha,মুক্তাগাছা,BD-DIV-08-DIST-02,Mymensingh,ময়মনসিংহ,BD-DIV-08,Mymensingh,ময়মনসিংহ
BD-DIV-08-DIST-02-UPZ-005,Mymensingh Sadar,ময়মনসিংহ সদর,BD-DIV-08-DIST-02,Mymensingh,ময়মনসিংহ,BD-DIV-08,Mymensingh,ময়মনসিংহ
BD-DIV-08-DIST-02-UPZ-006,Dhobaura,ধোবাউড়া,BD-DIV-08-DIST-02,Mymensingh,ময়মনসিংহ,BD-DIV-08,Mymensingh,ময়মনসিংহ
BD-DIV-08-DIST-02-UPZ-007,Phulpur,ফুলপুর,BD-DIV-08-DIST-02,Mymensingh,ময়মনসিংহ,BD-DIV-08,Mymensingh,ময়মনসিংহ
BD-DIV-08-DIST-02-UPZ-008,Haluaghat,হালুয়াঘাট,BD-DIV-08-DIST-02,Mymensingh,ময়মনসিংহ,BD-DIV-08,Mymensingh,ময়মনসিংহ
BD-DIV-08-DIST-02-UPZ-009,Gouripur,গৌরীপুর,BD-DIV-08-DIST-02,Mymensingh,ময়মনসিংহ,BD-DIV-08,Mymensingh,ময়মনসিংহ
BD-DIV-08-DIST-02-UPZ-010,Gafargaon,গফরগাঁও,BD-DIV-08-DIST-02,Mymensingh,ময়মনসিংহ,BD-DIV-08,Mymensingh,ময়মনসিংহ
BD-DIV-08-DIST-02-UPZ-011,Iswarganj,ঈশ্বরগঞ্জ,BD-DIV-08-DIST-02,Mymensingh,ময়মনসিংহ,BD-DIV-08,Mymensingh,ময়মনসিংহ
BD-DIV-08-DIST-02-UPZ-012,Nandail,নান্দাইল,BD-DIV-08-DIST-02,Mymensingh,ময়মনসিংহ,BD-DIV-08,Mymensingh,ময়মনসিংহ
BD-DIV-08-DIST-02-UPZ-013,Tarakanda,তারাকান্দা,BD-DIV-08-DIST-02,Mymensingh,ময়মনসিংহ,BD-DIV-08,Mymensingh,ময়মনসিংহ
BD-DIV-08-DIST-03-UPZ-001,Jamalpur Sadar,জামালপুর সদর,BD-DIV-08-DIST-03,Jamalpur,জামালপুর,BD-DIV-08,Mymensingh,ময়মনসিংহ
BD-DIV-08-DIST-03-UPZ-002,Melandah,মেলান্দহ,BD-DIV-08-DIST-03,Jamalpur,জামালপুর,BD-DIV-08,Mymensingh,ময়মনসিংহ
BD-DIV-08-DIST-03-UPZ-003,Islampur,ইসলামপুর,BD-DIV-08-DIST-03,Jamalpur,জামালপুর,BD-DIV-08,Mymensingh,ময়মনসিংহ
BD-DIV-08-DIST-03-UPZ-004,Dewangonj,দেওয়ানগঞ্জ,BD-DIV-08-DIST-03,Jamalpur,জামালপুর,BD-DIV-08,Mymensingh,ময়মনসিংহ
BD-DIV-08-DIST-03-UPZ-005,Sarishabari,সরিষাবাড়ী,BD-DIV-08-DIST-03,Jamalpur,জামালপুর,BD-DIV-08,Mymensingh,ময়মনসিংহ
BD-DIV-08-DIST-03-UPZ-006,Madarganj,মাদারগঞ্জ,BD-DIV-08-DIST-03,Jamalpur,জামালপুর,BD-DIV-08,Mymensingh,ময়মনসিংহ
BD-DIV-08-DIST-03-UPZ-007,Bokshiganj,বকশীগঞ্জ,BD-DIV-08-DIST-03,Jamalpur,জামালপুর,BD-DIV-08,Mymensingh,ময়মনসিংহ
BD-DIV-08-DIST-04-UPZ-001,Barhatta,বারহাট্টা,BD-DIV-08-DIST-04,Netrokona,নেত্রকোণা,BD-DIV-08,Mymensingh,ময়মনসিংহ
BD-DIV-08-DIST-04-UPZ-002,Durgapur,দুর্গাপুর,BD-DIV-08-DIST-04,Netrokona,নেত্রকোণা,BD-DIV-08,Mymensingh,ময়মনসিংহ
BD-DIV-08-DIST-04-UPZ-003,Kendua,কেন্দুয়া,BD-DIV-08-DIST-04,Netrokona,নেত্রকোণা,BD-DIV-08,Mymensingh,ময়মনসিংহ
BD-DIV-08-DIST-04-UPZ-004,Atpara,আটপাড়া,BD-DIV-08-DIST-04,Netrokona,নেত্রকোণা,BD-DIV-08,Mymensingh,ময়মনসিংহ
BD-DIV-08-DIST-04-UPZ-005,Madan,মদন,BD-DIV-08-DIST-04,Netrokona,নেত্রকোণা,BD-DIV-08,Mymensingh,ময়মনসিংহ
BD-DIV-08-DIST-04-UPZ-006,Khaliajuri,খালিয়াজুরী,BD-DIV-08-DIST-04,Netrokona,নেত্রকোণা,BD-DIV-08,Mymensingh,ময়মনসিংহ
BD-DIV-08-DIST-04-UPZ-007,Kalmakanda,কলমাকান্দা,BD-DIV-08-DIST-04,Netrokona,নেত্রকোণা,BD-DIV-08,Mymensingh,ময়মনসিংহ
BD-DIV-08-DIST-04-UPZ-008,Mohongonj,মোহনগঞ্জ,BD-DIV-08-DIST-04,Netrokona,নেত্রকোণা,BD-DIV-08,Mymensingh,ময়মনসিংহ
BD-DIV-08-DIST-04-UPZ-009,Purbadhala,পূর্বধলা,BD-DIV-08-DIST-04,Netrokona,নেত্রকোণা,BD-DIV-08,Mymensingh,ময়মনসিংহ
BD-DIV-08-DIST-04-UPZ-010,Netrokona Sadar,নেত্রকোণা সদর,BD-DIV-08-DIST-04,Netrokona,নেত্রকোণা,BD-DIV-08,Mymensingh,ময়মনসিংহ`;

async function initLocationDb() {
    console.log('🚀 Initializing Bangladesh Location Tables in Hostinger MySQL...');

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Create bd_divisions table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS bd_divisions (
                division_id VARCHAR(50) PRIMARY KEY,
                name_en VARCHAR(100) NOT NULL,
                name_bn VARCHAR(100) NOT NULL,
                parent_country_id VARCHAR(50) NOT NULL DEFAULT 'COUNTRY-BD',
                latitude DECIMAL(10,8) NULL,
                longitude DECIMAL(11,8) NULL,
                is_active TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 2. Create bd_districts table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS bd_districts (
                district_id VARCHAR(50) PRIMARY KEY,
                name_en VARCHAR(100) NOT NULL,
                name_bn VARCHAR(100) NOT NULL,
                division_id VARCHAR(50) NOT NULL,
                division_name_en VARCHAR(100) NOT NULL,
                division_name_bn VARCHAR(100) NOT NULL,
                latitude DECIMAL(10,8) NULL,
                longitude DECIMAL(11,8) NULL,
                is_active TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_dist_div (division_id),
                CONSTRAINT fk_dist_div FOREIGN KEY (division_id) REFERENCES bd_divisions(division_id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 3. Create bd_upazilas table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS bd_upazilas (
                upazila_id VARCHAR(50) PRIMARY KEY,
                name_en VARCHAR(100) NOT NULL,
                name_bn VARCHAR(100) NOT NULL,
                district_id VARCHAR(50) NOT NULL,
                district_name_en VARCHAR(100) NOT NULL,
                district_name_bn VARCHAR(100) NOT NULL,
                division_id VARCHAR(50) NOT NULL,
                division_name_en VARCHAR(100) NOT NULL,
                division_name_bn VARCHAR(100) NOT NULL,
                is_active TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_upz_dist (district_id),
                INDEX idx_upz_div (division_id),
                CONSTRAINT fk_upz_dist FOREIGN KEY (district_id) REFERENCES bd_districts(district_id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // Parse CSV blocks
        const lines = csvData.trim().split(/\r?\n/);
        let section = '';
        const divisions = [];
        const districts = [];
        const upazilas = [];

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            if (trimmed.startsWith('division_id,')) {
                section = 'divisions';
                continue;
            } else if (trimmed.startsWith('district_id,')) {
                section = 'districts';
                continue;
            } else if (trimmed.startsWith('upazila_id,')) {
                section = 'upazilas';
                continue;
            }

            const parts = trimmed.split(',');
            if (section === 'divisions') {
                divisions.push({
                    division_id: parts[0],
                    name_en: parts[1],
                    name_bn: parts[2],
                    parent_country_id: parts[3],
                    latitude: parts[4] ? parseFloat(parts[4]) : null,
                    longitude: parts[5] ? parseFloat(parts[5]) : null
                });
            } else if (section === 'districts') {
                districts.push({
                    district_id: parts[0],
                    name_en: parts[1],
                    name_bn: parts[2],
                    division_id: parts[3],
                    division_name_en: parts[4],
                    division_name_bn: parts[5],
                    latitude: parts[6] ? parseFloat(parts[6]) : null,
                    longitude: parts[7] ? parseFloat(parts[7]) : null
                });
            } else if (section === 'upazilas') {
                upazilas.push({
                    upazila_id: parts[0],
                    name_en: parts[1],
                    name_bn: parts[2],
                    district_id: parts[3],
                    district_name_en: parts[4],
                    district_name_bn: parts[5],
                    division_id: parts[6],
                    division_name_en: parts[7],
                    division_name_bn: parts[8]
                });
            }
        }

        console.log(`Parsed ${divisions.length} Divisions, ${districts.length} Districts, ${upazilas.length} Upazilas.`);

        // Insert Divisions
        for (const d of divisions) {
            await connection.query(`
                INSERT INTO bd_divisions (division_id, name_en, name_bn, parent_country_id, latitude, longitude)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_bn=VALUES(name_bn), latitude=VALUES(latitude), longitude=VALUES(longitude)
            `, [d.division_id, d.name_en, d.name_bn, d.parent_country_id, d.latitude, d.longitude]);
        }

        // Insert Districts
        for (const d of districts) {
            await connection.query(`
                INSERT INTO bd_districts (district_id, name_en, name_bn, division_id, division_name_en, division_name_bn, latitude, longitude)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_bn=VALUES(name_bn), division_name_en=VALUES(division_name_en), division_name_bn=VALUES(division_name_bn), latitude=VALUES(latitude), longitude=VALUES(longitude)
            `, [d.district_id, d.name_en, d.name_bn, d.division_id, d.division_name_en, d.division_name_bn, d.latitude, d.longitude]);
        }

        // Insert Upazilas
        for (const u of upazilas) {
            await connection.query(`
                INSERT INTO bd_upazilas (upazila_id, name_en, name_bn, district_id, district_name_en, district_name_bn, division_id, division_name_en, division_name_bn)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_bn=VALUES(name_bn), district_name_en=VALUES(district_name_en), district_name_bn=VALUES(district_name_bn), division_name_en=VALUES(division_name_en), division_name_bn=VALUES(division_name_bn)
            `, [u.upazila_id, u.name_en, u.name_bn, u.district_id, u.district_name_en, u.district_name_bn, u.division_id, u.division_name_en, u.division_name_bn]);
        }

        await connection.commit();
        console.log('✅ Successfully seeded bd_divisions, bd_districts, and bd_upazilas into Hostinger MySQL!');

        // Save structured JSON for zero-latency client usage
        const clientData = {
            country: {
                id: 'COUNTRY-BD',
                code: 'BD',
                name: 'Bangladesh',
                flag: '🇧🇩'
            },
            divisions,
            districts,
            upazilas
        };

        const jsonOutPath = path.join(__dirname, '../../client/data');
        if (!fs.existsSync(jsonOutPath)) {
            fs.mkdirSync(jsonOutPath, { recursive: true });
        }
        fs.writeFileSync(path.join(jsonOutPath, 'locations_bd.json'), JSON.stringify(clientData, null, 2), 'utf8');

        // Also write as JS file for direct script inclusion without fetch CORS/file issues
        const jsContent = `window.TRAVELUP_LOCATIONS_BD = ${JSON.stringify(clientData)};`;
        const jsOutPath = path.join(__dirname, '../../client/js');
        fs.writeFileSync(path.join(jsOutPath, 'locations_bd.js'), jsContent, 'utf8');

        console.log('✅ Client data written to client/data/locations_bd.json and client/js/locations_bd.js');

    } catch (err) {
        await connection.rollback();
        console.error('❌ Error during location database initialization:', err);
    } finally {
        connection.release();
        process.exit(0);
    }
}

initLocationDb();
