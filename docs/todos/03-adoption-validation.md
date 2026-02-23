# TODO 03 - Agent Adoption Doğrulaması

## Hedef

`agent-lifeline` için "agents want this" hipotezini ölçülebilir metriklerle doğrulamak.

## Hipotez

`/clear`, compaction ve agent switch sonrası context kaybı yaşayan kullanıcılar, snapshot + export akışını düzenli kullanır.

## Yapılacaklar

- [ ] Başarı metriklerini netleştir
- [ ] Ölçüm periyodu belirle (ör. 14 gün)
- [ ] Dağıtım kanalları planı oluştur (X, Reddit, GitHub, dev toplulukları)
- [ ] 3 kısa kullanım senaryosu üret (`save`, `show`, `export`)
- [ ] Geri bildirim formu/issue şablonu aç
- [ ] İlk cohort verisini topla

## Önerilen Metrikler

- [ ] npm weekly downloads
- [ ] GitHub star / watch artışı
- [ ] Issue/Discussion sayısı ve niteliği
- [ ] "First save" -> "second week return" oranı (manuel/anket temelli)
- [ ] "Export kullanımı" oranı (kullanıcı geri bildirimi üzerinden)

## Kabul Kriterleri (ilk doğrulama)

- [ ] 14 gün sonunda en az 20 gerçek kullanıcı sinyali (install, feedback, issue, star+yorum)
- [ ] En az 5 kullanıcıdan "context loss" problemine doğrudan çözüm olduğuna dair feedback
- [ ] En az 3 tekrarlı kullanım sinyali (aynı kullanıcıdan birden fazla kullanım geri bildirimi)

## Çıktı

- [ ] `docs/adoption-report.md` dosyasında kısa rapor (özet, metrikler, karar: devam/pivot)
