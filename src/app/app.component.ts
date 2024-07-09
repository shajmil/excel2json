import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import * as XLSX from 'xlsx';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'excel2json';
  jsonData: any;

  onFileChange(event: any) {
    const file = event.target.files[0];
    this.readExcel(file);
  }

  readExcel(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      this.jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: true });
      console.log(this.jsonData);
      const formattedData = this.formatQuranData(this.jsonData);

      this.downloadFormattedData(this.jsonData)
    };
    reader.readAsArrayBuffer(file);
  }
   formatQuranData(inputData: any[]): any {
    const formattedData: any = { quran_data: [] };
    let currentSurah: any = null;
    let currentAyah: any = null;
  
    inputData.forEach((item) => {
      if (item.Ayah_No === 0 && !currentSurah) {
        // Start a new surah
        currentSurah = {
          surah_name_english: item.surah_name_english,
          surah_name_arabic: item.surah_name_arabic,
          surah_name_english_translation: item.surah_name_english_translation,
          surah_name_Malayalam_translation: item.surah_name_Malayalam_translation,
          ayah: []
        };
        formattedData.quran_data.push(currentSurah);
      } else if (item.Ayah_No === 0 && currentSurah?.surah_name_english !== item.surah_name_english) {
        // Start a new surah if the name changes
        currentSurah = {
          surah_name_english: item.surah_name_english,
          surah_name_arabic: item.surah_name_arabic,
          surah_name_english_translation: item.surah_name_english_translation,
          surah_name_Malayalam_translation: item.surah_name_Malayalam_translation,
          ayah: []
        };
        formattedData.quran_data.push(currentSurah);
      }
  
      if (item.arabic_ayah_line) {
        // Start a new ayah
        currentAyah = {
          arabic_ayah_line: item.arabic_ayah_line,
          english_line_translation: item.english_line_translation,
          Malayalam_line_translation: item.Malyalam_line_translation,
          arabic_ayah_word: [],
          malayalam_ayah_word: [],
          english_ayah_word: []
        };
        currentSurah.ayah.push(currentAyah);
      }
  
      if (item.arabic_ayah_word) {
        currentAyah.arabic_ayah_word.push(item.arabic_ayah_word);
        currentAyah.malayalam_ayah_word.push(item.Malyalam_ayah_word);
        currentAyah.english_ayah_word.push(item.english_ayah_word);
      }
    });
  
    return formattedData;
  }


  downloadFormattedData(inputData: any[]): void {
    const formattedData = this.formatQuranData(inputData);
    const jsonString = JSON.stringify(formattedData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'formatted_quran_data.json';
    link.click();
    
    window.URL.revokeObjectURL(url);
  }
}
