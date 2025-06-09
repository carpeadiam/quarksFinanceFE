export function parseSRT(srtContent: string) {
  const srtLines = srtContent.trim().split('\n\n');
  
  return srtLines.map(block => {
    const lines = block.split('\n');
    const id = parseInt(lines[0]);
    const timeCode = lines[1];
    const text = lines.slice(2).join(' ');
    
    // Parse the time code (00:00:00,000 --> 00:00:00,000)
    const [startTime, endTime] = timeCode.split(' --> ').map(timeStr => {
      const [time, milliseconds] = timeStr.split(',');
      const [hours, minutes, seconds] = time.split(':').map(Number);
      
      return (
        hours * 3600000 + 
        minutes * 60000 + 
        seconds * 1000 + 
        parseInt(milliseconds)
      );
    });
    
    return {
      id,
      startTime,
      endTime,
      text
    };
  });
}