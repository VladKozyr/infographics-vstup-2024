# -*- coding: utf-8 -*-
import pandas as pd
import json
import numpy as np
from pathlib import Path

def process_vstup_data(excel_file_path, output_dir="data"):
    import os
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    try:
        df = pd.read_excel(excel_file_path)
        
        # Look for the specific "Конкурсний бал" column
        mark_column = None
        for col in df.columns:
            if u'конкурсний бал' in col.lower():
                mark_column = col
                break
        
        if mark_column is None:
            print("Available columns:")
            for i, col in enumerate(df.columns):
                print("  {}: {}".format(i, col))
            print("Error: Could not find 'Конкурсний бал' column")
            return []
        
        print("Using mark column: {}".format(mark_column))
        
        # Find subject columns - new logic for НМТ/ЗНО structure
        subject_keywords = [
            u'біологія', u'фізика', u'іноземна мова', u'українська мова', 
            u'хімія', u'математика', u'історія', u'географія'
        ]
        
        # Find columns that contain subject names and mark scores
        subject_name_columns = []
        mark_columns = []
        
        for i, col in enumerate(df.columns):
            col_lower = col.lower()
            if u'предмет' in col_lower and any(keyword in col_lower for keyword in [u'нмт', u'зно', u'вступний іспит']):
                subject_name_columns.append(i)
            elif u'бал' in col_lower and any(keyword in col_lower for keyword in [u'нмт', u'зно', u'вступний іспит']):
                mark_columns.append(i)
        
        print("Found subject name columns at indices: {}".format(subject_name_columns))
        print("Found mark columns at indices: {}".format(mark_columns))
        
        # Process subject data to find marks
        subject_columns = {}
        
        # Pair subject columns with mark columns
        for subj_idx, mark_idx in zip(subject_name_columns, mark_columns):
            subject_col = df.columns[subj_idx]
            mark_col = df.columns[mark_idx]
            
            print("Processing subject column '{}' with mark column '{}'".format(subject_col, mark_col))
            
            # Check what subjects are in this subject column
            unique_subjects = df[subject_col].dropna().unique()
            print("Unique subjects in {}: {}".format(subject_col, unique_subjects[:10]))  # Show first 10
            
            # For each subject keyword, check if it appears in the subject values
            for subject in subject_keywords:
                # Check if this subject appears in any of the values
                subject_mask = df[subject_col].str.contains(subject, case=False, na=False)
                if subject_mask.any():
                    print("Found '{}' in column '{}'".format(subject, subject_col))
                    # Store both the subject column and mark column for this subject
                    subject_columns[subject] = {'subject_col': subject_col, 'mark_col': mark_col}
        
        print("Found subject-mark column pairs: {}".format(subject_columns))
        print("Number of subject columns found: {}".format(len(subject_columns)))
        
        # Subject name mapping for output JSON (Ukrainian -> English)
        subject_name_mapping = {
            u'біологія': 'biology',
            u'фізика': 'physics', 
            u'іноземна мова': 'foreign_language',
            u'українська мова': 'ukrainian_language',
            u'хімія': 'chemistry',
            u'математика': 'mathematics',
            u'історія': 'history',
            u'географія': 'geography'
        }
        
        # Find key columns
        key_columns = {
            'specialty': None,
            'financing': None,
            'sex': None
        }
        
        for col in df.columns:
            col_lower = col.lower()
            if any(keyword in col_lower for keyword in [u'спеціальність', 'specialty']):
                key_columns['specialty'] = col
            elif any(keyword in col_lower for keyword in [u'форма фінансування', u'фінансування', 'financing']):
                key_columns['financing'] = col
            elif any(keyword in col_lower for keyword in [u'стать', 'sex', 'gender']):
                key_columns['sex'] = col
        
        print("Identified key columns: {}".format(key_columns))
        
        # Check if all key columns were found
        missing_columns = [k for k, v in key_columns.items() if v is None]
        if missing_columns:
            print("Warning: Could not identify columns for: {}".format(missing_columns))
            print("Available columns:")
            for i, col in enumerate(df.columns):
                print("  {}: {}".format(i, col))
            return []
        
        # Clean data
        df_clean = df.dropna(subset=list(key_columns.values()))
        df_clean[mark_column] = pd.to_numeric(df_clean[mark_column], errors='coerce')
        
        # Convert subject mark columns to numeric
        for subject, col_info in subject_columns.items():
            mark_col = col_info['mark_col']
            df_clean[mark_col] = pd.to_numeric(df_clean[mark_col], errors='coerce')
        
        df_clean = df_clean.dropna(subset=[mark_column])
        
        print("Final dataset size: {}".format(len(df_clean)))
        
        # Group by specialty, financing, and sex - calculate average scores
        grouped = df_clean.groupby([
            key_columns['specialty'], 
            key_columns['financing'], 
            key_columns['sex']
        ])[mark_column].agg(['mean', 'count']).round(3)
        
        # Calculate subject averages separately (since we need to filter by subject name)
        subject_averages = {}
        for subject, col_info in subject_columns.items():
            subject_col = col_info['subject_col']
            mark_col = col_info['mark_col']
            
            # Filter rows where this subject appears in the subject column
            subject_mask = df_clean[subject_col].str.contains(subject, case=False, na=False)
            subject_data = df_clean[subject_mask]
            
            if len(subject_data) > 0:
                # Group and calculate averages for this subject
                subject_grouped = subject_data.groupby([
                    key_columns['specialty'], 
                    key_columns['financing'], 
                    key_columns['sex']
                ])[mark_col].mean().round(3)
                
                subject_averages[subject] = subject_grouped
                print("Calculated averages for '{}': {} groups".format(subject, len(subject_grouped)))
            else:
                print("No data found for subject '{}'".format(subject))
        
        # Format output as requested
        result = []
        for (specialty, financing, sex) in grouped.index:
            record = {
                'specialty': specialty,
                'financing': financing,
                'sex': sex,
                'score': float(grouped.loc[(specialty, financing, sex), 'mean']),
                'count': int(grouped.loc[(specialty, financing, sex), 'count'])
            }
            
            # Add subject scores directly as fields (fill missing with 0)
            for subject in subject_averages:
                try:
                    subject_score = subject_averages[subject].loc[(specialty, financing, sex)]
                    # Use English key name for output
                    english_key = subject_name_mapping.get(subject, subject)
                    if not pd.isna(subject_score):
                        record[english_key] = float(subject_score)
                    else:
                        record[english_key] = 0.0
                except KeyError:
                    # No data for this group, set to 0
                    english_key = subject_name_mapping.get(subject, subject)
                    record[english_key] = 0.0
            
            # Ensure all expected English subject fields are present (even if no subjects detected)
            for ukrainian_name, english_key in subject_name_mapping.items():
                if english_key not in record:
                    record[english_key] = 0.0
            
            result.append(record)
        
        # Save main grouped data to JSON
        output_file = "{}/vstup_2024_grouped.json".format(output_dir)
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        # Create subject-focused analysis
        if subject_columns:
            subject_analysis = []
            for subject, col_info in subject_columns.items():
                subject_col = col_info['subject_col']
                mark_col = col_info['mark_col']
                
                # Filter rows where this subject appears in the subject column
                subject_mask = df_clean[subject_col].str.contains(subject, case=False, na=False)
                subject_data = df_clean[subject_mask]
                
                if len(subject_data) > 0:
                    subject_grouped = subject_data.groupby([
                        key_columns['specialty'], 
                        key_columns['financing'], 
                        key_columns['sex']
                    ])[mark_col].agg(['mean', 'count']).round(3)
                    
                    for (specialty, financing, sex) in subject_grouped.index:
                        mean_score = subject_grouped.loc[(specialty, financing, sex), 'mean']
                        count = subject_grouped.loc[(specialty, financing, sex), 'count']
                        
                        if not pd.isna(mean_score) and count > 0:
                            subject_analysis.append({
                                'subject': subject,
                                'specialty': specialty,
                                'financing': financing,
                                'sex': sex,
                                'score': float(mean_score),
                                'count': int(count)
                            })
            
            # Save subject analysis
            subjects_file = "{}/vstup_2024_subjects.json".format(output_dir)
            with open(subjects_file, 'w', encoding='utf-8') as f:
                json.dump(subject_analysis, f, ensure_ascii=False, indent=2)
            
            print("📊 Subject records created: {}".format(len(subject_analysis)))
            print("📁 Subjects file: {}".format(subjects_file))
        
        print("✅ Processing completed!")
        print("📊 Main groups created: {}".format(len(result)))
        print("📁 Main output file: {}".format(output_file))
        
        return result
        
    except FileNotFoundError:
        print("❌ Error: File '{}' not found.".format(excel_file_path))
        print("Please make sure the file exists and the path is correct.")
        return []
    except Exception as e:
        print("❌ Error processing file: {}".format(str(e)))
        import traceback
        traceback.print_exc()
        return []

def main():
    excel_file_path = "./data/vstup_2024.xlsx"
    
    
    print("🚀 Starting VSTUP 2024 data processing...")
    print("📂 Looking for file: {}".format(excel_file_path))
    
    if not Path(excel_file_path).exists():
        print("❌ File not found: {}".format(excel_file_path))
        print("\n💡 Please:")
        print("1. Place vstup_2024.xlsx in the same directory as this script, OR")
        print("2. Update the 'excel_file_path' variable with the correct path")
        return
    
    result = process_vstup_data(excel_file_path)
    
    if result:
        print("\n🎉 Data processing completed!")
        print("You can now use the generated JSON files in your D3.js visualization.")

if __name__ == "__main__":
    main()