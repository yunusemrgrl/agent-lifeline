# TODO 02 - CI/CD Aktivasyonu ve Doğrulama

## Hedef

GitHub Actions iş akışlarının gerçekten tetiklendiğini ve başarılı geçtiğini doğrulamak.

## Kapsam

- `CI`: `.github/workflows/ci.yml`
- `Landing Pages`: `.github/workflows/landing-pages.yml`
- `Release`: `.github/workflows/release.yml`

## Yapılacaklar

- [x] `main` branch'e test amaçlı küçük bir commit push et
- [x] CI workflow'un tetiklendiğini doğrula
- [x] CI adımlarının geçtiğini doğrula (`lint`, `test`, `pack:check`)
- [x] Landing workflow'u tetikle ve deploy al
- [x] Release workflow için publish yetkili npm token doğrulamasını tamamla (`NPM_TOKEN`)
- [x] `workflow_dispatch` ile manuel tetik testini yap

## Kabul Kriterleri

- [x] Actions sekmesinde 3 workflow da en az bir kez tetiklenmiş
- [x] CI workflow son durumu `success`
- [x] Landing deploy URL'i üretmiş
- [x] Release workflow publish öncesi adımları hatasız çalışmış

## Durum

- Landing Pages artık aktif: `https://yunusemrgrl.github.io/agent-lifeline/`
- Release workflow başarılı çalıştı ve npm paket yayınlandı (`agent-lifeline@0.2.0`).

## Notlar

- `release.yml` gerçek npm publish yapar. Yanlışlıkla sürüm publish etmemek için versiyon ve token kullanımını dikkatli yönet.
