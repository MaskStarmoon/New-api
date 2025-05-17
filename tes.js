document.addEventListener("DOMContentLoaded", () => {
  const enableBtn = document.getElementById("enable");
  const disableBtn = document.getElementById("disable");

  enableBtn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: (gifUrl) => {
          if (!document.getElementById('ai-mascot')) {
            const mascot = document.createElement('div');
            mascot.id = 'ai-mascot';
            mascot.style.position = 'fixed';
            mascot.style.zIndex = 999999;
            mascot.style.right = '20px';
            mascot.style.top = '20px';
            mascot.style.cursor = 'grab';
            mascot.style.userSelect = 'none';

            mascot.innerHTML = `
              <img src="${gifUrl}" width="100" style="display:block; animation: float 3s ease-in-out infinite; z-index: 1; position: relative;">
              <div id="mascot-greeting" style="
                position: absolute; 
                bottom: 110%; 
                left: 50%; 
                transform: translateX(-50%);
                background: rgba(255,255,255,0.95);
                padding: 6px 12px; 
                border-radius: 10px; 
                font-size: 14px;
                color: #333;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                white-space: nowrap;
                opacity: 0;
                transition: opacity 0.5s ease;
                z-index: 10;
              ">Hii! I'm your mascot AI 👋</div>
              <div id="mascot-reply" style="
                  position: absolute;
                  bottom: 110%; 
                  left: 50%;
                  transform: translateX(-50%);
                  background: #fff;
                  border: 1px solid #ccc;
                  border-radius: 10px;
                  padding: 10px;
                  width: 250px;
                  word-wrap: break-word;
                  word-break: break-word;
                  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                  display: none;
                  font-size: 14px;
                  z-index: 999999;
                  white-space: normal;
              "></div>
            `;

            document.body.appendChild(mascot);

            const style = document.createElement('style');
            style.textContent = `
              @keyframes float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
              }
            `;
            document.head.appendChild(style);

            const greeting = mascot.querySelector('#mascot-greeting');
            setTimeout(() => greeting.style.opacity = '1', 500);
            setTimeout(() => greeting.style.opacity = '0', 5000);

            let isDragging = false;
            let offsetX = 0;
            let offsetY = 0;

            mascot.addEventListener('mousedown', (e) => {
              isDragging = true;
              mascot.style.cursor = 'grabbing';
              
              const rect = mascot.getBoundingClientRect();
              offsetX = e.clientX - rect.left;
              offsetY = e.clientY - rect.top;
              e.preventDefault(); 
            });

            document.addEventListener('mousemove', (e) => {
              if (isDragging) {
                mascot.style.left = `${e.clientX - offsetX}px`;
                mascot.style.top = `${e.clientY - offsetY}px`;
                mascot.style.right = 'auto'; 
              }
            });

            document.addEventListener('mouseup', () => {
              if (isDragging) {
                isDragging = false;
                mascot.style.cursor = 'grab';
              }
            });

            mascot.addEventListener('click', () => {
              const userInput = prompt("Tanya sesuatu ke AI:");
              if (userInput) {
                const replyBubble = mascot.querySelector('#mascot-reply');
                replyBubble.textContent = "Currently answering...";
                replyBubble.style.display = "block";

                fetch(`https://api-rangestudio.vercel.app/api/gemini?text=${encodeURIComponent(userInput)}`)
                  .then(res => res.json())
                  .then(data => {
                    const aiReply = data.answer || "Sorry, no response.";
                    replyBubble.textContent = aiReply;
                  })
                  .catch(() => {
                    replyBubble.textContent = "Failed to contact AI.";
                  });
              }
            });
          }
        },
        args: [
          "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExc296eGd0ZWJldHRyYmwyemtiYTExajBmOTNncjc5NHNrcnhib3dkYyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/rpkvgo4UnIrlhMEikq/giphy.gif"
        ]
      });
    });
  });

  disableBtn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: () => {
          const mascot = document.getElementById('ai-mascot');
          if (mascot) mascot.remove();
        }
      });
    });
  });
});
