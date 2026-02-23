# TODO 01 - Repo Bootstrap + İlk Push

## Hedef

`agent-lifeline` klasörünü bağımsız git repo haline getirip GitHub'a ilk push'u yapmak.

## Yapılacaklar

- [ ] `git init` ile repo başlat
- [ ] Varsayılan branch'i `main` yap
- [ ] Uygun `.gitignore` kontrolü yap
- [ ] İlk commit'i oluştur
- [ ] GitHub remote (`origin`) ekle
- [ ] `main` branch'i push et

## Kabul Kriterleri

- [ ] `git status` temiz veya beklenen değişikliklerle okunabilir
- [ ] `git remote -v` çıktısında `origin` var
- [ ] `git ls-remote --heads origin main` ile `main` görünüyor

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
