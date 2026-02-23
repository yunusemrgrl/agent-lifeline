# TODO 01 - Repo Bootstrap + İlk Push

## Hedef

`agent-lifeline` klasörünü bağımsız git repo haline getirip GitHub'a ilk push'u yapmak.

## Yapılacaklar

- [x] `git init` ile repo başlat
- [x] Varsayılan branch'i `main` yap
- [x] Uygun `.gitignore` kontrolü yap
- [x] İlk commit'i oluştur
- [x] GitHub remote (`origin`) ekle
- [x] `main` branch'i push et

## Kabul Kriterleri

- [x] `git status` temiz veya beklenen değişikliklerle okunabilir
- [x] `git remote -v` çıktısında `origin` var
- [x] `git ls-remote --heads origin main` ile `main` görünüyor

## Komut Taslağı

```bash
cd /path/to/agent-lifeline
git init
git branch -M main
git add .
git commit -m "chore: initialize agent-lifeline standalone repo"
git remote add origin <github-repo-url>
git push -u origin main
```
