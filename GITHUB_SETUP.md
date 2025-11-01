# GitHub Repository Kurulumu

## Adımlar:

### 1. GitHub'da Yeni Repository Oluştur
1. GitHub.com'a git
2. "New repository" butonuna tıkla
3. Repository adını gir: `Hospital_eAppointment` (veya istediğin isim)
4. Public veya Private seç
5. **"Initialize this repository with a README"** işaretleme (README zaten var)
6. "Create repository" butonuna tıkla

### 2. Local Repository'yi GitHub'a Bağla

PowerShell'de şu komutları çalıştır:

```powershell
# GitHub repository URL'ini al (örnek: https://github.com/kullaniciadi/Hospital_eAppointment.git)
# Sonra şu komutu çalıştır (URL'yi kendi repository URL'in ile değiştir):

cd C:\SoftwareProjects\TanerSaydam\Hospital_eAppointment

git remote add origin https://github.com/KULLANICI_ADI/Hospital_eAppointment.git

git branch -M main

git commit -m "Initial commit: Add Angular client and .NET server with Clean Architecture"

git push -u origin main
```

### 3. Alternatif: SSH Kullanıyorsan

```powershell
git remote add origin git@github.com:KULLANICI_ADI/Hospital_eAppointment.git
git branch -M main
git commit -m "Initial commit: Add Angular client and .NET server with Clean Architecture"
git push -u origin main
```

## Önemli Notlar:

- `KULLANICI_ADI` yerine kendi GitHub kullanıcı adını yaz
- Eğer 2FA aktifse, GitHub'da Personal Access Token oluşturman gerekebilir
- İlk commit mesajını değiştirmek istersen, yukarıdaki commit mesajını düzenle

## Sonraki Commit'ler İçin:

```powershell
git add .
git commit -m "Commit mesajı buraya"
git push
```

