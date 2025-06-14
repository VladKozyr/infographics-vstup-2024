class VstupRadialChart {
    constructor({ width = window.innerWidth, height = window.innerHeight } = {}) {
        this.data = [];
        this.width = width;
        this.height = height;
        this.innerRadius = 120;
        this.outerRadius = Math.min(this.width, this.height) * 0.35;
        this.reductionRadius = this.outerRadius + 30;
        this.opacity = 0.6;
        
        this.targetFinancing = ["Бюджет", "Контракт", "За рахунок цільових пільг"];
        
        this.init();
    }
    
    async init() {
        await this.loadData();
        this.processData();
        this.createVisualization();
    }
    
    async loadData() {
        try {
            this.data = await d3.json('data/vstup_2024_grouped.json');
            console.log('Loaded real data:', this.data.length, 'records');
        } catch (error) {
            console.log('Loading sample data...');
            this.data = this.generateSampleData();
        }
    }
    
    generateSampleData() {
        const specialties = [
            '221 Стоматологія',
            '222 Медицина', 
            '081 Право',
            '073 Менеджмент',
            '051 Економіка',
            '121 Інженерія ПЗ',
            '122 Комп\'ютерні науки',
            '131 Механіка',
            '014 Середня освіта',
            '035 Філологія',
            '076 Підприємництво',
            '072 Фінанси',
            '151 Автоматизація',
            '161 Хімічні технології'
        ];
        
        const financing = ['Бюджет', 'Контракт', 'За рахунок цільових пільг'];
        const sexes = ['Ч', 'Ж'];
        
        const sampleData = [];
        
        specialties.forEach(specialty => {
            financing.forEach(fin => {
                sexes.forEach(sex => {
                    sampleData.push({
                        specialty: specialty,
                        financing: fin,
                        sex: sex,
                        score: Math.random() * 50 + 150,
                        count: Math.floor(Math.random() * 500) + 50,
                        biology: Math.random() * 50 + 120,
                        physics: Math.random() * 40 + 110,
                        foreign_language: Math.random() * 60 + 140,
                        ukrainian_language: Math.random() * 45 + 135,
                        chemistry: Math.random() * 55 + 125,
                        mathematics: Math.random() * 50 + 130,
                        history: Math.random() * 40 + 115,
                        geography: Math.random() * 35 + 105
                    });
                });
            });
        });
        
        return sampleData;
    }
    
    processData() {
        this.specialtyGroups = d3.group(this.data, d => d.specialty);
        
        this.specialties = Array.from(this.specialtyGroups.keys()).map(specialty => {
            const specialtyData = this.specialtyGroups.get(specialty);
            return {
                name: specialty,
                freq: specialtyData.length
            };
        });
        
        this.processedData = [];
        
        this.specialtyGroups.forEach((records, specialty) => {
            const financingScores = {};
            const subjectScores = {};
            
            // Group by financing within specialty
            const financingGroups = d3.group(records, d => d.financing);
            
            // Calculate average score for each financing type
            this.targetFinancing.forEach(fin => {
                const finData = financingGroups.get(fin) || [];
                if (finData.length > 0) {
                    financingScores[fin] = d3.mean(finData, d => d.score);
                    
                    // Also calculate subject averages for this financing type
                    const subjects = ['biology', 'physics', 'foreign_language', 'ukrainian_language', 
                                    'chemistry', 'mathematics', 'history', 'geography'];
                    
                    subjects.forEach(subject => {
                        const subjectKey = `${subject}_${fin}`;
                        const validScores = finData.filter(d => d[subject] && d[subject] > 0);
                        if (validScores.length > 0) {
                            subjectScores[subjectKey] = d3.mean(validScores, d => d[subject]);
                        }
                    });
                }
            });
            
            // Calculate reduction (difference between budget and contract)
            const budgetScore = financingScores['Бюджет'] || 0;
            const contractScore = financingScores['Контракт'] || 0;
            const reduction = budgetScore - contractScore;
            
            this.processedData.push({
                specialty: specialty,
                ...financingScores,
                ...subjectScores,
                reduction: reduction
            });
        });
        
        console.log('Processed data:', this.processedData);
    }
    
    createVisualization() {
        console.log('Creating visualization...');
        console.log('Data length:', this.data.length);
        console.log('Processed data length:', this.processedData?.length);
        
        // Clear existing content
        // d3.select('#chart-container').selectAll('*').remove();

        // Create SVG
        const svg = d3.select('#chart-svg');

        const lensRadius = this.outerRadius + 10;
        const leftLensCenter = { x: this.width/3 - 30, y: this.height / 2 };
        const rightLensCenter = { x: (this.width*2)/3 + 30, y: this.height / 2 };

        const leftG = svg.append('g')
            .attr('transform', `translate(${leftLensCenter.x}, ${leftLensCenter.y})`);
        const rightG = svg.append('g')
            .attr('transform', `translate(${rightLensCenter.x}, ${rightLensCenter.y})`);

    svg.append("circle")
      .attr("id", "left-lens")
      .attr("cx", leftLensCenter.x)
      .attr("cy", leftLensCenter.y)
      .attr("r", lensRadius)
      .attr("stroke", "black")
      .attr("stroke-width", 5)
      .attr("fill", "none");

    svg.append("circle")
      .attr("id", "right-lens")
      .attr("cx", rightLensCenter.x)
      .attr("cy", rightLensCenter.y)
      .attr("r", lensRadius)
      .attr("stroke", "black")
      .attr("stroke-width", 5)
      .attr("fill", "none");

    svg.append("path")
      .attr("d", d3.line()([
        [leftLensCenter.x + lensRadius, leftLensCenter.y],
        [leftLensCenter.x + lensRadius + 20, leftLensCenter.y - 10],
        [rightLensCenter.x - lensRadius - 20, rightLensCenter.y - 10],
        [rightLensCenter.x - lensRadius, rightLensCenter.y]
      ]))
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", 5);

      const templeLength = 120;
const templeAngle = 20;

const rad = Math.PI / 180;
const angleRad = templeAngle * rad;

svg.append("line")
  .attr("x1", leftLensCenter.x - lensRadius * Math.cos(angleRad))
  .attr("y1", leftLensCenter.y - lensRadius * Math.sin(angleRad))
  .attr("x2", leftLensCenter.x - (lensRadius + templeLength) * Math.cos(angleRad))
  .attr("y2", leftLensCenter.y - (lensRadius + templeLength) * Math.sin(angleRad))
  .attr("stroke", "black")
  .attr("stroke-width", 5);

// Right temple: extends up and right from right lens
svg.append("line")
  .attr("x1", rightLensCenter.x + lensRadius * Math.cos(angleRad))
  .attr("y1", rightLensCenter.y - lensRadius * Math.sin(angleRad))
  .attr("x2", rightLensCenter.x + (lensRadius + templeLength) * Math.cos(angleRad))
  .attr("y2", rightLensCenter.y - (lensRadius + templeLength) * Math.sin(angleRad))
  .attr("stroke", "black")
  .attr("stroke-width", 5);
        
        // Create both left (financing) and right (gender) visualizations
        this.createFinancingVisualization(leftG);
        this.createGenderVisualization(rightG);
    }
    
    createFinancingVisualization(g) {
        // Pie generator
        const pie = d3.pie()
            .sort(null)
            .value(d => d.freq)
            .padAngle(0.05);
        
        // Create specialty arcs
        const specialtyArcs = pie(this.specialties);
        
        // Arc generator for specialty segments
        const specialtyArc = d3.arc()
            .innerRadius(this.innerRadius * 0.6)
            .outerRadius(this.outerRadius * 0.6);
        
        // Add specialty segments (outer ring)
        g.selectAll('path.specialty-financing')
            .data(specialtyArcs)
            .join('path')
            .attr('id', d => `specialty-financing-${d.data.name.replace(/[^a-zA-Z0-9]/g, '')}`)
            .attr('class', 'specialty-financing')
            .attr('fill', '#3b82f6')
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 1)
            .attr('fill-opacity', 0.8)
            .attr('d', specialtyArc)
            .style('cursor', 'pointer')
            .on('click', (event, d) => this.selectSpecialty(d.data.name));
        
        // Calculate angles for each specialty
        const specialtyAngles = {};
        specialtyArcs.forEach(arc => {
            const specialtyName = arc.data.name;
            specialtyAngles[specialtyName] = (arc.startAngle + arc.endAngle) / 2;
        });
        
        // Add radial dividing lines and invisible sector areas
        const maxRadius = this.outerRadius - 30;
        
        // Create invisible sector areas for hover detection
        specialtyArcs.forEach(arc => {
            const sectorArc = d3.arc()
                .innerRadius(0)
                .outerRadius(maxRadius)
                .startAngle(arc.startAngle)
                .endAngle(arc.endAngle);
            
            // Add invisible sector area for hover
            g.append('path')
                .attr('d', sectorArc)
                .attr('fill', 'transparent')
                .attr('class', `sector-hover-financing-${arc.data.name.replace(/[^a-zA-Z0-9]/g, '')}`)
                .style('cursor', 'pointer')
                .on('mouseover', (event) => {
                    this.showSpecialtyTooltip(event, arc.data.name);
                    this.updateFinancingRadarChart(arc.data.name);
                })
                .on('mousemove', (event) => {
                    this.showSpecialtyTooltip(event, arc.data.name);
                })
                .on('mouseout', () => {
                    if (!this.selectedSpecialty) {
                        this.updateFinancingRadarChart();
                    }
                })
                .on('click', () => {
                    this.selectSpecialty(arc.data.name);
                });
        });
        
        // Add divider lines
        specialtyArcs.forEach(arc => {
            const angle = arc.startAngle;
            const lineEndX = Math.cos(angle) * maxRadius;
            const lineEndY = Math.sin(angle) * maxRadius;
            
            g.append('line')
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', lineEndX)
                .attr('y2', lineEndY)
                .attr('stroke', '#64748b')
                .attr('stroke-width', 1.5)
                .attr('stroke-opacity', 0.4);
        });
        
        // Add financing radar chart in center
        const innerRadius = maxRadius / 1.5;
        this.addFinancingRadarChart(g, innerRadius, specialtyAngles);
        
        // Add reduction area chart (budget vs contract difference)
        this.createFinancingReductionChart(g, specialtyAngles, maxRadius);
        
        // Store references
        this.leftG = g;
        this.specialtyAngles = specialtyAngles;
        
        // Add title
        g.append('text')
            .attr('x', 0)
            .attr('y', -maxRadius - 65)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .style('fill', '#374151')
            .text('Бюджет vs Контракт');
    }
    
    createGenderVisualization(g) {
        const pie = d3.pie()
            .sort(null)
            .value(d => d.freq)
            .padAngle(0.05);
        
        // Create specialty arcs
        const specialtyArcs = pie(this.specialties);
        
        // Arc generator for specialty segments
        const specialtyArc = d3.arc()
            .innerRadius(this.innerRadius * 0.6)
            .outerRadius(this.outerRadius * 0.6);
        
        // Add specialty segments (outer ring)
        g.selectAll('path.specialty-gender')
            .data(specialtyArcs)
            .join('path')
            .attr('id', d => `specialty-gender-${d.data.name.replace(/[^a-zA-Z0-9]/g, '')}`)
            .attr('class', 'specialty-gender')
            .attr('fill', '#ec4899')
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 1)
            .attr('fill-opacity', 0.8)
            .attr('d', specialtyArc)
            .style('cursor', 'pointer')
            .on('click', (event, d) => this.selectSpecialty(d.data.name));
        
        // Calculate angles for each specialty
        const specialtyAngles = {};
        specialtyArcs.forEach(arc => {
            const specialtyName = arc.data.name;
            specialtyAngles[specialtyName] = (arc.startAngle + arc.endAngle) / 2;
        });
        
        // Add radial dividing lines and invisible sector areas
        const maxRadius = this.outerRadius - 30;
        
        // Create invisible sector areas for hover detection
        specialtyArcs.forEach(arc => {
            const sectorArc = d3.arc()
                .innerRadius(0)
                .outerRadius(maxRadius)
                .startAngle(arc.startAngle)
                .endAngle(arc.endAngle);
            
            // Add invisible sector area for hover
            g.append('path')
                .attr('d', sectorArc)
                .attr('fill', 'transparent')
                .attr('class', `sector-hover-gender-${arc.data.name.replace(/[^a-zA-Z0-9]/g, '')}`)
                .style('cursor', 'pointer')
                .on('mouseover', (event) => {
                    this.showSpecialtyGenderTooltip(event, arc.data.name);
                    this.updateGenderRadarChart(arc.data.name);
                })
                .on('mousemove', (event) => {
                    this.showSpecialtyGenderTooltip(event, arc.data.name);
                })
                .on('mouseout', () => {
                    if (!this.selectedSpecialty) {
                        this.updateGenderRadarChart();
                    }
                })
                .on('click', () => {
                    this.selectSpecialty(arc.data.name);
                });
        });
        
        specialtyArcs.forEach(arc => {
            const angle = arc.startAngle;
            const lineEndX = Math.cos(angle) * maxRadius;
            const lineEndY = Math.sin(angle) * maxRadius;
            
            g.append('line')
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', lineEndX)
                .attr('y2', lineEndY)
                .attr('stroke', '#64748b')
                .attr('stroke-width', 1.5)
                .attr('stroke-opacity', 0.4);
        });
        
        // Add gender radar chart in center
        const innerRadius = maxRadius / 1.5;
        this.addGenderRadarChart(g, innerRadius, specialtyAngles);
        
        // Add reduction area chart (male vs female difference)
        this.createGenderReductionChart(g, specialtyAngles, maxRadius);
        
        // Store references
        this.rightG = g;
        
        // Add title
        g.append('text')
            .attr('x', 0)
            .attr('y', -maxRadius - 65)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .style('fill', '#374151')
            .text('Чоловік vs Жінка');
    }
    
    createFinancingReductionChart(g, specialtyAngles, maxRadius) {
        // Create scale for the financing reduction metrics (Budget - Contract)
        const reductionData = this.processedData.map(d => ({
            specialty: d.specialty,
            reduction: (d['Бюджет'] || 0) - (d['Контракт'] || 0)
        }));
        
        const maxReduction = d3.max(reductionData, d => Math.abs(d.reduction)) || 1;
        const reductionScale = d3.scaleLinear()
            .domain([-maxReduction, maxReduction])
            .range([-20, 20]);
        
        const reductionRadius = maxRadius + 15;
        
        // Sort specialties by their angle
        const sortedSpecialties = Object.entries(specialtyAngles)
            .sort((a, b) => a[1] - b[1])
            .map(([specialty]) => specialty);
        
        const reductionPoints = sortedSpecialties.map(specialty => {
            const specialtyReduction = reductionData.find(d => d.specialty === specialty);
            return {
                angle: specialtyAngles[specialty],
                reduction: specialtyReduction ? specialtyReduction.reduction : 0,
                specialty: specialty
            };
        });
        
        // Add a point at the end to close the path
        if (reductionPoints.length > 0) {
            const firstPoint = reductionPoints[0];
            reductionPoints.push({
                angle: firstPoint.angle + 2 * Math.PI,
                reduction: firstPoint.reduction,
                specialty: firstPoint.specialty
            });
        }
        
        // Create the area generator for the reduction chart
        const areaGenerator = d3.areaRadial()
            .angle(d => d.angle)
            .innerRadius(reductionRadius)
            .outerRadius(d => reductionRadius + reductionScale(d.reduction))
            .curve(d3.curveCardinal);
        
        // Add the reduction area chart
        g.append('path')
            .datum(reductionPoints)
            .attr('d', areaGenerator)
            .attr('fill', '#008000')
            .attr('fill-opacity', 0.6)
            .attr('stroke', '#004C00')
            .attr('stroke-width', 2);
    }
    
    createGenderReductionChart(g, specialtyAngles, maxRadius) {
        // Create scale for the gender reduction metrics (Male - Female)
        const reductionData = [];
        
        // Calculate male vs female differences for each specialty
        this.specialties.forEach(spec => {
            const specialty = spec.name;
            const maleData = this.data.filter(d => d.specialty === specialty && d.sex === 'Ч');
            const femaleData = this.data.filter(d => d.specialty === specialty && d.sex === 'Ж');
            
            const maleAvg = maleData.length > 0 ? d3.mean(maleData, d => d.score) : 0;
            const femaleAvg = femaleData.length > 0 ? d3.mean(femaleData, d => d.score) : 0;
            
            reductionData.push({
                specialty: specialty,
                reduction: maleAvg - femaleAvg
            });
        });
        
        const maxReduction = d3.max(reductionData, d => Math.abs(d.reduction)) || 1;
        const reductionScale = d3.scaleLinear()
            .domain([-maxReduction, maxReduction])
            .range([-20, 20]);
        
        const reductionRadius = maxRadius + 15;
        
        // Sort specialties by their angle
        const sortedSpecialties = Object.entries(specialtyAngles)
            .sort((a, b) => a[1] - b[1])
            .map(([specialty]) => specialty);
        
        const reductionPoints = sortedSpecialties.map(specialty => {
            const specialtyReduction = reductionData.find(d => d.specialty === specialty);
            return {
                angle: specialtyAngles[specialty],
                reduction: specialtyReduction ? specialtyReduction.reduction : 0,
                specialty: specialty
            };
        });
        
        // Add a point at the end to close the path
        if (reductionPoints.length > 0) {
            const firstPoint = reductionPoints[0];
            reductionPoints.push({
                angle: firstPoint.angle + 2 * Math.PI,
                reduction: firstPoint.reduction,
                specialty: firstPoint.specialty
            });
        }
        
        // Create the area generator for the reduction chart
        const areaGenerator = d3.areaRadial()
            .angle(d => d.angle)
            .innerRadius(reductionRadius)
            .outerRadius(d => reductionRadius + reductionScale(d.reduction))
            .curve(d3.curveCardinal);
        
        // Add the reduction area chart
        g.append('path')
            .datum(reductionPoints)
            .attr('d', areaGenerator)
            .attr('fill', '#6366f1')
            .attr('fill-opacity', 0.6)
            .attr('stroke', '#3B3D90')
            .attr('stroke-width', 2);
    }
    
    showSpecialtyTooltip(event, specialtyName) {
        console.log('Showing tooltip for:', specialtyName); // Debug log
        
        let tooltip = d3.select('#tooltip');
        if (tooltip.empty()) {
            tooltip = d3.select('body').append('div')
                .attr('id', 'tooltip')
                .style('position', 'absolute')
                .style('background', 'rgba(0, 0, 0, 0.92)')
                .style('color', 'white')
                .style('padding', '12px')
                .style('border-radius', '8px')
                .style('font-size', '12px')
                .style('pointer-events', 'none')
                .style('opacity', 0)
                .style('z-index', 1000)
                .style('box-shadow', '0 6px 20px rgba(0,0,0,0.4)')
                .style('border', '1px solid rgba(255,255,255,0.1)')
                .style('max-width', '300px');
        }
        
        // Find data for this specialty
        const specialtyData = this.processedData.find(d => d.specialty === specialtyName);
        
        let tooltipContent = `<div style="font-weight: bold; margin-bottom: 10px; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 8px;">${specialtyName}</div>`;
        
        if (specialtyData) {
            // Add financing comparison
            const budgetScore = specialtyData['Бюджет'];
            const contractScore = specialtyData['Контракт'];
            
            if (budgetScore && contractScore) {
                tooltipContent += `<div style="margin-bottom: 12px;">`;
                tooltipContent += `<div style="display: flex; justify-content: space-between; margin-bottom: 4px;">`;
                tooltipContent += `<span>📊 Бюджет:</span><span style="color: #3b82f6; font-weight: bold;">${budgetScore.toFixed(1)}</span>`;
                tooltipContent += `</div>`;
                tooltipContent += `<div style="display: flex; justify-content: space-between; margin-bottom: 6px;">`;
                tooltipContent += `<span>💰 Контракт:</span><span style="color: #ef4444; font-weight: bold;">${contractScore.toFixed(1)}</span>`;
                tooltipContent += `</div>`;
                
                // Show difference
                const difference = budgetScore - contractScore;
                const diffColor = difference > 0 ? '#22c55e' : '#ef4444';
                const diffIcon = difference > 0 ? '📈' : '📉';
                const diffText = difference > 0 ? `+${difference.toFixed(1)}` : `${difference.toFixed(1)}`;
                tooltipContent += `<div style="display: flex; justify-content: space-between; padding: 4px 8px; background: rgba(255,255,255,0.1); border-radius: 4px;">`;
                tooltipContent += `<span>${diffIcon} Різниця:</span><span style="color: ${diffColor}; font-weight: bold;">${diffText}</span>`;
                tooltipContent += `</div>`;
                tooltipContent += `</div>`;
            }
            
            
            // Add top performing subjects
            const subjects = ['biology', 'physics', 'mathematics', 'ukrainian_language', 'foreign_language', 'chemistry'];
            const subjectLabels = {
                'biology': '🧬 Біологія',
                'physics': '⚛️ Фізика', 
                'mathematics': '📐 Математика',
                'ukrainian_language': '📚 Українська',
                'foreign_language': '🌍 Іноземна',
                'chemistry': '🧪 Хімія'
            };
            
            const validSubjects = subjects
                .filter(subject => specialtyData[subject] && specialtyData[subject] > 0)
                .map(subject => ({
                    name: subject,
                    score: specialtyData[subject],
                    label: subjectLabels[subject]
                }))
                .sort((a, b) => b.score - a.score)
                .slice(0, 4);
            
            if (validSubjects.length > 0) {
                tooltipContent += `<div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 8px;">`;
                tooltipContent += `<div style="font-weight: bold; margin-bottom: 6px; color: #cccccc;">Топ предмети:</div>`;
                validSubjects.forEach((subject, i) => {
                    const isTop = i === 0;
                    const textColor = isTop ? '#ffd700' : '#ffffff';
                    const bgColor = isTop ? 'rgba(255, 215, 0, 0.15)' : 'transparent';
                    tooltipContent += `<div style="display: flex; justify-content: space-between; margin-bottom: 3px; padding: 2px 6px; background: ${bgColor}; border-radius: 3px;">`;
                    tooltipContent += `<span style="color: ${textColor};">${subject.label}</span><span style="color: ${textColor}; font-weight: bold;">${subject.score.toFixed(1)}</span>`;
                    tooltipContent += `</div>`;
                });
                tooltipContent += `</div>`;
            }
            
            
        } else {
            tooltipContent += `<div style="color: #cccccc; font-style: italic; text-align: center; padding: 20px;">`;
            tooltipContent += `Дані для цієї спеціальності відсутні<br/>`;
            tooltipContent += `<span style="font-size: 11px;">Натисніть для деталей</span>`;
            tooltipContent += `</div>`;
        }
        
        tooltip.html(tooltipContent)
            .style('left', (event.pageX + 15) + 'px')
            .style('top', (event.pageY - 10) + 'px')
            .style('opacity', 1);
    }

    addFinancingRadarChart(g, maxRadius, specialtyAngles) {
        // Add background circle with light gradient
        const defs = g.append('defs');
        const radarGradient = defs.append('radialGradient')
            .attr('id', 'radarGradient')
            .attr('cx', '50%')
            .attr('cy', '50%')
            .attr('r', '50%');
        
        radarGradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#ffffff')
            .attr('stop-opacity', 0.9);
        
        radarGradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#f1f5f9')
            .attr('stop-opacity', 0.7);
        
        g.append('circle')
            .attr('r', maxRadius)
            .attr('fill', 'url(#radarGradient)')
            .attr('stroke', '#cbd5e1')
            .attr('stroke-width', 2);
        
        // Store financing radar chart reference for updates
        this.financingRadarGroup = g.append('g').attr('class', 'financing-radar-chart');
        this.financingRadarMaxRadius = maxRadius;
        
        // Calculate subject averages by sex for all data initially
        const subjects = ['biology', 'physics', 'foreign_language', 'ukrainian_language', 
                         'chemistry', 'mathematics', 'history', 'geography'];
        
        const subjectLabels = {
            'biology': 'Біологія',
            'physics': 'Фізика',
            'foreign_language': 'Іноземна',
            'ukrainian_language': 'Українська',
            'chemistry': 'Хімія',
            'mathematics': 'Математика',
            'history': 'Історія',
            'geography': 'Географія'
        };
        
        this.subjects = subjects;
        this.subjectLabels = subjectLabels;
        
        // Use fixed scale: 0 = center, 200 = edge (100%)
        this.financingRadarScale = d3.scaleLinear()
            .domain([0, 200])
            .range([0, maxRadius - 20]);
        
        // Add static elements (grid and axes)
        this.setupFinancingRadarStatic();
        
        // Initialize with empty radar chart
        this.showEmptyFinancingRadarChart();
    }
    
    setupFinancingRadarStatic() {
        const maxRadius = this.financingRadarMaxRadius;
        
        // Add grid circles with scale labels
        const gridLevels = 4;
        for (let i = 1; i <= gridLevels; i++) {
            const radius = (maxRadius - 20) * i / gridLevels;
            const scaleValue = 100 + (100 * i / gridLevels); // Scale from 100 to 200
            
            // Add grid circle
            this.financingRadarGroup.append('circle')
                .attr('r', radius)
                .attr('fill', 'none')
                .attr('stroke', '#64748b')
                .attr('stroke-width', 1)
                .attr('stroke-opacity', 0.3);
            
            // Add scale label
            this.financingRadarGroup.append('text')
                .attr('x', 5)
                .attr('y', -radius + 3)
                .attr('text-anchor', 'start')
                .attr('dominant-baseline', 'middle')
                .style('font-size', '9px')
                .style('fill', '#64748b')
                .style('font-weight', 'normal')
                .text(scaleValue.toFixed(0));
        }
        
        // Add center scale label (100)
        this.financingRadarGroup.append('text')
            .attr('x', 5)
            .attr('y', 3)
            .attr('text-anchor', 'start')
            .attr('dominant-baseline', 'middle')
            .style('font-size', '9px')
            .style('fill', '#64748b')
            .style('font-weight', 'normal')
            .text('100');
        
        // Add axis lines and labels
        this.subjects.forEach((subject, i) => {
            const angle = (i * 2 * Math.PI) / this.subjects.length - Math.PI / 2;
            const x = Math.cos(angle) * (maxRadius - 10);
            const y = Math.sin(angle) * (maxRadius - 10);
            
            // Axis line
            this.financingRadarGroup.append('line')
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', x)
                .attr('y2', y)
                .attr('stroke', '#64748b')
                .attr('stroke-width', 1)
                .attr('stroke-opacity', 0.5);
            
            // Label
            const labelRadius = maxRadius + 15;
            const labelX = Math.cos(angle) * labelRadius;
            const labelY = Math.sin(angle) * labelRadius;
            
            this.financingRadarGroup.append('text')
                .attr('x', labelX)
                .attr('y', labelY)
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'middle')
                .style('font-size', '10px')
                .style('fill', '#374151')
                .style('font-weight', 'bold')
                .text(this.subjectLabels[subject]);
        });
    }
    
    addGenderRadarChart(g, maxRadius, specialtyAngles) {
        // Add background circle with light gradient
        const defs = g.append('defs');
        const radarGradient = defs.append('radialGradient')
            .attr('id', 'genderRadarGradient')
            .attr('cx', '50%')
            .attr('cy', '50%')
            .attr('r', '50%');
        
        radarGradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#ffffff')
            .attr('stop-opacity', 0.9);
        
        radarGradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#f1f5f9')
            .attr('stop-opacity', 0.7);
        
        g.append('circle')
            .attr('r', maxRadius)
            .attr('fill', 'url(#genderRadarGradient)')
            .attr('stroke', '#cbd5e1')
            .attr('stroke-width', 2);
        
        // Store gender radar chart reference for updates
        this.genderRadarGroup = g.append('g').attr('class', 'gender-radar-chart');
        this.genderRadarMaxRadius = maxRadius;
        
        this.genderRadarScale = d3.scaleLinear()
            .domain([0, 200])
            .range([0, maxRadius - 20]);
        
        // Add static elements (grid and axes)
        this.setupGenderRadarStatic();
        
        // Initialize with empty radar chart
        this.showEmptyGenderRadarChart();
    }
    
    setupGenderRadarStatic() {
        const maxRadius = this.genderRadarMaxRadius;
        
        // Add grid circles with scale labels
        const gridLevels = 4;
        for (let i = 1; i <= gridLevels; i++) {
            const radius = (maxRadius - 20) * i / gridLevels;
            const scaleValue = 100 + (100 * i / gridLevels);
            
            this.genderRadarGroup.append('circle')
                .attr('r', radius)
                .attr('fill', 'none')
                .attr('stroke', '#64748b')
                .attr('stroke-width', 1)
                .attr('stroke-opacity', 0.3);
            
            this.genderRadarGroup.append('text')
                .attr('x', 5)
                .attr('y', -radius + 3)
                .attr('text-anchor', 'start')
                .attr('dominant-baseline', 'middle')
                .style('font-size', '9px')
                .style('fill', '#64748b')
                .style('font-weight', 'normal')
                .text(scaleValue.toFixed(0));
        }
        
        this.genderRadarGroup.append('text')
            .attr('x', 5)
            .attr('y', 3)
            .attr('text-anchor', 'start')
            .attr('dominant-baseline', 'middle')
            .style('font-size', '9px')
            .style('fill', '#64748b')
            .style('font-weight', 'normal')
            .text('100');
        
        // Add axis lines and labels
        this.subjects.forEach((subject, i) => {
            const angle = (i * 2 * Math.PI) / this.subjects.length - Math.PI / 2;
            const x = Math.cos(angle) * (maxRadius - 10);
            const y = Math.sin(angle) * (maxRadius - 10);
            
            this.genderRadarGroup.append('line')
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', x)
                .attr('y2', y)
                .attr('stroke', '#64748b')
                .attr('stroke-width', 1)
                .attr('stroke-opacity', 0.5);
            
            const labelRadius = maxRadius + 15;
            const labelX = Math.cos(angle) * labelRadius;
            const labelY = Math.sin(angle) * labelRadius;
            
            this.genderRadarGroup.append('text')
                .attr('x', labelX)
                .attr('y', labelY)
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'middle')
                .style('font-size', '10px')
                .style('fill', '#374151')
                .style('font-weight', 'bold')
                .text(this.subjectLabels[subject]);
        });
    }
    
    updateFinancingRadarChart(selectedSpecialty = null) {
        console.log('updateRadarChart called with:', selectedSpecialty);
        
        // If no specialty is selected, show empty radar chart
        if (!selectedSpecialty) {
            console.log('Showing empty financing radar chart');
            this.showEmptyFinancingRadarChart();
            return;
        }
        
        // Filter data by selected specialty
        const filteredData = this.data.filter(d => d.specialty === selectedSpecialty);
        console.log('Filtered data length:', filteredData.length);
        
        // Group data by financing type (combining both genders)
        const financingGroups = d3.group(filteredData, d => d.financing);
        const radarData = {};
        
        ['Бюджет', 'Контракт'].forEach(financing => {
            const financingData = financingGroups.get(financing) || [];
            radarData[financing] = [];
            
            this.subjects.forEach((subject, i) => {
                // Combine data from both genders for this financing type
                const allValidScores = [];
                
                // Group by gender within this financing type
                const genderGroups = d3.group(financingData, d => d.sex);
                
                // Collect all valid scores from both genders
                ['Ч', 'Ж'].forEach(gender => {
                    const genderData = genderGroups.get(gender) || [];
                    const validScores = genderData.filter(d => d[subject] && d[subject] > 0);
                    allValidScores.push(...validScores.map(d => d[subject]));
                });
                
                // Calculate average across all students (both genders) for this financing type
                const avgScore = allValidScores.length > 0 ? d3.mean(allValidScores) : 0;
                
                radarData[financing].push({
                    subject: subject,
                    label: this.subjectLabels[subject],
                    score: avgScore,
                    angle: (i * 2 * Math.PI) / this.subjects.length - Math.PI / 2
                });
            });
        });
        
        // Create area generator for radar chart
        const radarLine = d3.lineRadial()
            .angle(d => d.angle)
            .radius(d => this.financingRadarScale(d.score))
            .curve(d3.curveLinearClosed);
        
        // Financing colors
        const financingColors = {
            'Бюджет': '#008000',
            'Контракт': '#f97316'
        };
        
        // Update radar areas for each financing type
        Object.entries(radarData).forEach(([financing, data]) => {
            // Update or create area
            let areaPath = this.financingRadarGroup.select(`.radar-area-${financing}`);
            if (areaPath.empty()) {
                areaPath = this.financingRadarGroup.append('path')
                    .attr('class', `radar-area-${financing}`)
                    .attr('fill', financingColors[financing])
                    .attr('fill-opacity', 0)
                    .attr('stroke', financingColors[financing])
                    .attr('stroke-width', 2)
                    .attr('stroke-opacity', 0);
            }
            
            areaPath.datum(data)
                .transition()
                .duration(750)
                .attr('d', radarLine)
                .attr('fill-opacity', 0.3)
                .attr('stroke-opacity', 1);
        });
    }
    
    showEmptyFinancingRadarChart() {
        // Hide all financing radar areas
        this.financingRadarGroup.selectAll('.radar-area-Бюджет, .radar-area-Контракт')
            .transition()
            .duration(500)
            .attr('fill-opacity', 0)
            .attr('stroke-opacity', 0);
    }
    
    updateGenderRadarChart(selectedSpecialty = null) {
        console.log('updateGenderRadarChart called with:', selectedSpecialty);
        
        // If no specialty is selected, show empty radar chart
        if (!selectedSpecialty) {
            console.log('Showing empty gender radar chart');
            this.showEmptyGenderRadarChart();
            return;
        }
        
        // Filter data by selected specialty
        const filteredData = this.data.filter(d => d.specialty === selectedSpecialty);
        console.log('Gender filtered data length:', filteredData.length);
        
        // Group data by gender (combining both financing types)
        const genderGroups = d3.group(filteredData, d => d.sex);
        const radarData = {};
        
        ['Ч', 'Ж'].forEach(gender => {
            const genderData = genderGroups.get(gender) || [];
            radarData[gender] = [];
            
            this.subjects.forEach((subject, i) => {
                // Combine data from both financing types for this gender
                const allValidScores = [];
                
                // Group by financing within this gender
                const financingGroups = d3.group(genderData, d => d.financing);
                
                // Collect all valid scores from both financing types
                ['Бюджет', 'Контракт'].forEach(financing => {
                    const financingData = financingGroups.get(financing) || [];
                    const validScores = financingData.filter(d => d[subject] && d[subject] > 0);
                    allValidScores.push(...validScores.map(d => d[subject]));
                });
                
                // Calculate average across all students (both financing types) for this gender
                const avgScore = allValidScores.length > 0 ? d3.mean(allValidScores) : 0;
                
                radarData[gender].push({
                    subject: subject,
                    label: this.subjectLabels[subject],
                    score: avgScore,
                    angle: (i * 2 * Math.PI) / this.subjects.length - Math.PI / 2
                });
            });
        });
        
        // Create area generator for radar chart
        const radarLine = d3.lineRadial()
            .angle(d => d.angle)
            .radius(d => this.genderRadarScale(d.score))
            .curve(d3.curveLinearClosed);
        
        // Gender colors
        const genderColors = {
            'Ч': '#6366f1',
            'Ж': '#ec4899'
        };
        
        // Update radar areas for each gender
        Object.entries(radarData).forEach(([gender, data]) => {
            // Update or create area
            let areaPath = this.genderRadarGroup.select(`.radar-area-${gender}`);
            if (areaPath.empty()) {
                areaPath = this.genderRadarGroup.append('path')
                    .attr('class', `radar-area-${gender}`)
                    .attr('fill', genderColors[gender])
                    .attr('fill-opacity', 0)
                    .attr('stroke', genderColors[gender])
                    .attr('stroke-width', 2)
                    .attr('stroke-opacity', 0);
            }
            
            areaPath.datum(data)
                .transition()
                .duration(750)
                .attr('d', radarLine)
                .attr('fill-opacity', 0.3)
                .attr('stroke-opacity', 1);
        });
    }
    
    showEmptyGenderRadarChart() {
        // Hide all gender radar areas
        this.genderRadarGroup.selectAll('.radar-area-Ч, .radar-area-Ж')
            .transition()
            .duration(500)
            .attr('fill-opacity', 0)
            .attr('stroke-opacity', 0);
    }
    
    
    createLegend(g, colorScale) {
        const legend = g.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${this.width/2 - 100}, ${this.height/2 - 100})`);
        
        this.targetFinancing.forEach((financing, i) => {
            const legendItem = legend.append('g')
                .attr('transform', `translate(0, ${i * 25})`);
            
            legendItem.append('circle')
                .attr('r', 8)
                .attr('fill', colorScale(financing))
                .attr('opacity', this.opacity);
            
            legendItem.append('text')
                .attr('x', 15)
                .attr('y', 5)
                .style('font-size', '12px')
                .attr('fill', '#ffffff')
                .text(financing);
        });
    }
    
    showTooltip(event, d, financing) {
        let tooltip = d3.select('#tooltip');
        if (tooltip.empty()) {
            tooltip = d3.select('body').append('div')
                .attr('id', 'tooltip')
                .style('position', 'absolute')
                .style('background', 'rgba(0, 0, 0, 0.9)')
                .style('color', 'white')
                .style('padding', '10px')
                .style('border-radius', '5px')
                .style('font-size', '12px')
                .style('pointer-events', 'none')
                .style('opacity', 0);
        }
        
        tooltip.html(`
            <strong>${d.specialty}</strong><br/>
            Тип фінансування: ${financing}<br/>
            Середній бал: ${d[financing].toFixed(1)}<br/>
            Різниця з контрактом: ${d.reduction.toFixed(1)}
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px')
        .transition()
        .duration(200)
        .style('opacity', 1);
    }
    
    
    showFinancingTooltip(event, d, financing) {
        let tooltip = d3.select('#tooltip');
        if (tooltip.empty()) {
            tooltip = d3.select('body').append('div')
                .attr('id', 'tooltip')
                .style('position', 'absolute')
                .style('background', 'rgba(0, 0, 0, 0.9)')
                .style('color', 'white')
                .style('padding', '10px')
                .style('border-radius', '5px')
                .style('font-size', '12px')
                .style('pointer-events', 'none')
                .style('opacity', 0);
        }
        
        // Get subject scores for this financing type
        const subjectLabels = {
            'biology': 'Біологія',
            'physics': 'Фізика',
            'foreign_language': 'Іноземна мова',
            'ukrainian_language': 'Українська мова',
            'chemistry': 'Хімія',
            'mathematics': 'Математика',
            'history': 'Історія',
            'geography': 'Географія'
        };
        
        let subjectInfo = '';
        Object.keys(subjectLabels).forEach(subject => {
            const subjectKey = `${subject}_${financing}`;
            if (d[subjectKey] && d[subjectKey] > 0) {
                subjectInfo += `<br/>${subjectLabels[subject]}: ${d[subjectKey].toFixed(1)}`;
            }
        });
        
        tooltip.html(`
            <strong>${d.specialty}</strong><br/>
            Тип фінансування: ${financing}<br/>
            Середній бал: ${d[financing].toFixed(1)}
            ${subjectInfo}
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px')
        .transition()
        .duration(200)
        .style('opacity', 1);
    }
    
    hideTooltip() {
        d3.select('#tooltip')
            .transition()
            .duration(200)
            .style('opacity', 0);
    }

    showSpecialtyGenderTooltip(event, specialtyName) {
    console.log('Showing gender tooltip for:', specialtyName);

    let tooltip = d3.select('#tooltip');
    if (tooltip.empty()) {
        tooltip = d3.select('body').append('div')
            .attr('id', 'tooltip')
            .style('position', 'absolute')
            .style('background', 'rgba(0, 0, 0, 0.92)')
            .style('color', 'white')
            .style('padding', '12px')
            .style('border-radius', '8px')
            .style('font-size', '12px')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .style('z-index', 1000)
            .style('box-shadow', '0 6px 20px rgba(0,0,0,0.4)')
            .style('border', '1px solid rgba(255,255,255,0.1)')
            .style('max-width', '300px');
    }

    const maleData = this.data.filter(d => d.specialty === specialtyName && d.sex === 'Ч');
    const femaleData = this.data.filter(d => d.specialty === specialtyName && d.sex === 'Ж');

    const maleAvg = maleData.length > 0 ? d3.mean(maleData, d => d.score) : null;
    const femaleAvg = femaleData.length > 0 ? d3.mean(femaleData, d => d.score) : null;

    let tooltipContent = `<div style="font-weight: bold; margin-bottom: 10px; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 8px;">${specialtyName}</div>`;

    if (maleAvg !== null && femaleAvg !== null) {
        tooltipContent += `<div style="margin-bottom: 12px;">`;
        tooltipContent += `<div style="display: flex; justify-content: space-between; margin-bottom: 4px;">`;
        tooltipContent += `<span>👨 Чоловіки:</span><span style="color: #6366f1; font-weight: bold;">${maleAvg.toFixed(1)}</span>`;
        tooltipContent += `</div>`;
        tooltipContent += `<div style="display: flex; justify-content: space-between; margin-bottom: 6px;">`;
        tooltipContent += `<span>👩 Жінки:</span><span style="color: #ec4899; font-weight: bold;">${femaleAvg.toFixed(1)}</span>`;
        tooltipContent += `</div>`;

        const diff = maleAvg - femaleAvg;
        const diffColor = diff > 0 ? '#22c55e' : '#ef4444';
        const diffIcon = diff > 0 ? '📈' : '📉';
        const diffText = diff > 0 ? `+${diff.toFixed(1)}` : `${diff.toFixed(1)}`;
        tooltipContent += `<div style="display: flex; justify-content: space-between; padding: 4px 8px; background: rgba(255,255,255,0.1); border-radius: 4px;">`;
        tooltipContent += `<span>${diffIcon} Різниця:</span><span style="color: ${diffColor}; font-weight: bold;">${diffText}</span>`;
        tooltipContent += `</div>`;
        tooltipContent += `</div>`;
    }

    if (maleAvg === null && femaleAvg === null) {
        tooltipContent += `<div style="color: #cccccc; font-style: italic; text-align: center; padding: 20px;">`;
        tooltipContent += `Дані для цієї спеціальності відсутні<br/>`;
        tooltipContent += `<span style="font-size: 11px;">Натисніть для деталей</span>`;
        tooltipContent += `</div>`;
    }

    tooltip.html(tooltipContent)
        .style('left', (event.pageX + 15) + 'px')
        .style('top', (event.pageY - 10) + 'px')
        .style('opacity', 1);
}

    
    selectSpecialty(specialtyName) {
        console.log('Selected specialty:', specialtyName);
        
        // Update radar chart with selected specialty data
        this.updateRadarChart(specialtyName);
        
        // Highlight selected specialty sector (outer ring)
        this.g.selectAll('path.specialty')
            .transition()
            .duration(300)
            .attr('fill', d => d.data.name === specialtyName ? '#ff6b35' : '#4a90e2');
        
        // Keep tooltip visible for selected specialty
        // The tooltip will remain visible until mouse moves to another sector
        
        // Store current selection
        this.selectedSpecialty = specialtyName;
        
        // Add double-click to reset
        if (this.selectedSpecialty === specialtyName) {
            setTimeout(() => {
                this.g.selectAll('path.specialty')
                    .on('dblclick', () => this.resetSelection());
            }, 100);
        }
    }
    
    resetSelection() {
        console.log('Reset selection');
        
        // Reset radar chart to show all data
        this.updateRadarChart();
        
        // Reset specialty sector highlighting (outer ring)
        this.g.selectAll('path.specialty')
            .transition()
            .duration(300)
            .attr('fill', '#4a90e2');
        
        // Hide tooltip
        this.hideTooltip();
        
        this.selectedSpecialty = null;
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Starting VSTUP 2024 Radial Chart...');
    const container = document.getElementById('chart-container');
    const { width, height } = container.getBoundingClientRect();
    new VstupRadialChart({ width, height });
});