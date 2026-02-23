# TODO 03 - Agent Adoption Doğrulaması

## Hedef

`agent-lifeline` için "agents want this" hipotezini ölçülebilir metriklerle doğrulamak.

## Hipotez

`/clear`, compaction ve agent switch sonrası context kaybı yaşayan kullanıcılar, snapshot + export akışını düzenli kullanır.

## Yapılacaklar

- [x] Başarı metriklerini netleştir
- [x] Ölçüm periyodu belirle (ör. 14 gün)
- [x] Dağıtım kanalları planı oluştur (X, Reddit, GitHub, dev toplulukları)
- [x] 3 kısa kullanım senaryosu üret (`save`, `show`, `export`)
- [x] Geri bildirim formu/issue şablonu aç
- [ ] İlk cohort verisini topla

## Önerilen Metrikler

- [ ] npm weekly downloads
- [x] GitHub star / watch artışı
- [x] Issue/Discussion sayısı ve niteliği
- [ ] "First save" -> "second week return" oranı (manuel/anket temelli)
- [ ] "Export kullanımı" oranı (kullanıcı geri bildirimi üzerinden)

## Kabul Kriterleri (ilk doğrulama)

- [ ] 14 gün sonunda en az 20 gerçek kullanıcı sinyali (install, feedback, issue, star+yorum)
- [ ] En az 5 kullanıcıdan "context loss" problemine doğrudan çözüm olduğuna dair feedback
- [ ] En az 3 tekrarlı kullanım sinyali (aynı kullanıcıdan birden fazla kullanım geri bildirimi)

## Çıktı

- [x] `docs/adoption-report.md` dosyasında kısa rapor (özet, metrikler, karar: devam/pivot)
