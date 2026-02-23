# TODO 02 - CI/CD Aktivasyonu ve Doğrulama

## Hedef

GitHub Actions iş akışlarının gerçekten tetiklendiğini ve başarılı geçtiğini doğrulamak.

## Kapsam

- `CI`: `.github/workflows/ci.yml`
- `Landing Pages`: `.github/workflows/landing-pages.yml`
- `Release`: `.github/workflows/release.yml`

## Yapılacaklar

- [ ] `main` branch'e test amaçlı küçük bir commit push et
- [ ] CI workflow'un tetiklendiğini doğrula
- [ ] CI adımlarının geçtiğini doğrula (`lint`, `test`, `pack:check`)
- [ ] Landing workflow'u `landing/**` değişikliği ile tetikle
- [ ] Release workflow için gerekli secret'ları kontrol et (`NPM_TOKEN`)
- [ ] `workflow_dispatch` ile manuel tetik testini yap

## Kabul Kriterleri

- [ ] Actions sekmesinde 3 workflow da en az bir kez tetiklenmiş
- [ ] CI workflow son durumu `success`
- [ ] Landing deploy URL'i üretmiş
- [ ] Release workflow en azından publish öncesi adımları hatasız çalıştırmış

## Notlar

- `release.yml` gerçek npm publish yapar. Yanlışlıkla sürüm publish etmemek için versiyon ve token kullanımını dikkatli yönet.
