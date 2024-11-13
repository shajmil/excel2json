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
      
      // Initialize array to store all sheets' data
      let allSheetsData: any[] = [];
      
      // Process all sheets
      workbook.SheetNames.forEach((sheetName, sheetIndex) => {
        const worksheet = workbook.Sheets[sheetName];
        const sheetData = XLSX.utils.sheet_to_json(worksheet, { raw: true });
        // Add sheet index as metadata
        sheetData.forEach((item: any) => {
          item._sheetIndex = sheetIndex; // Sheet 1 will be index 0, Sheet 2 will be 1, etc.
        });
        allSheetsData = allSheetsData.concat(sheetData);
      });

      this.jsonData = allSheetsData;
      const formattedData = this.formatQuranData(this.jsonData);
      this.downloadFormattedData(this.jsonData);
    };
    reader.readAsArrayBuffer(file);
  }
   formatQuranData(inputData: any[]): any {
    const formattedData: any = { quran_db: [] };
    let currentSurah: any = null;
    let currentAyah: any = null;
    let processedSurahs = new Set(); // To track processed surahs
  
    inputData.forEach((item) => {
      // Only create a new surah if we haven't processed this sheet index before
      if (item.Ayah_No === 0 && !processedSurahs.has(item._sheetIndex)) {
        processedSurahs.add(item._sheetIndex);
        
        currentSurah = {
          surah_id: item._sheetIndex,
          surah_name_english: item.surah_name_english,
          surah_name_arabic: item.surah_name_arabic,
          surah_name_english_translation: item.surah_name_english_translation,
          surah_name_Malayalam_translation: item.surah_name_Malayalam_translation,
          ayah: []
        };
        formattedData.quran_db.push(currentSurah);
      }
  
      // Only process ayahs for the current surah
      if (currentSurah && item._sheetIndex === currentSurah.surah_id) {
        if (item.arabic_ayah_line) {
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
    link.download = 'formatted_quran_db.json';
    link.click();
    
    window.URL.revokeObjectURL(url);
  }
}
