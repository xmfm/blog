window.addEventListener("load", () => {
    updateContentInput();
});

function updateContentInput() {
    const source = document.getElementById("source").value;
    const contentGroup = document.getElementById("contentGroup");

    // 清空内容
    contentGroup.innerHTML = "";

    let contentInput;
    if (source === "text") {
        contentInput = document.createElement("textarea");
        contentInput.placeholder = "请输入通知内容";
        contentInput.rows = 4;
    } else if (source === "built-in") {
        contentInput = document.createElement("select");
        const options = ["N5","N4","N3","N2","N1"];
        options.forEach((optionText) => {
            const option = document.createElement("option");
            option.value = optionText;
            option.text = optionText;
            contentInput.add(option);
        });
    } else if (source === "file") {
        contentInput = document.createElement("input");
        contentInput.type = "file";
        contentInput.accept = "text/plain,text/csv";
    }

    if (contentInput) {
        contentInput.id = "contentInput";
        contentInput.style.width = "100%";
        contentGroup.appendChild(contentInput);
    }
}

function toggleNotifications() {
    const isEnabled = document.getElementById("notificationToggle").checked;
    if (isEnabled) {
        if (Notification?.permission === "granted") {
            startNotificationCycle();
        } else {
            if (Notification?.permission !== "denied"){
                // 如果用户没有告诉他们是否想要收到通知（注意：由于 Chrome，我们不确定是否设置了权限属性），因此检查“默认”值是不安全的。
                Notification.requestPermission().then((status) => {
                // 如果用户同意
                if (status === "granted") {
                    const n = new Notification(`授权成功`, {body:"请重新点击开始"});
                } else {alert("授权被拒绝，想继续使用请刷新重试");}
                });
            } else {alert("授权被拒绝，想继续使用请刷新重试");}
            document.getElementById("notificationToggle").checked = false;
        }
    } else {
        stopNotificationCycle();
    }
}

let notificationIntervalId;

function startNotificationCycle() {
    const source = document.getElementById("source").value;
    const interval = parseInt(document.getElementById("interval").value * 1000 * 60, 10);
    const repeatCount = parseInt(document.getElementById("repeatCount").value, 10);
    const select_mode = document.getElementById("select-mode").value;
    const nextNotification = document.getElementById("nextNotification");
    var contents;

    if (source === "text") {
        contents = document.getElementById("contentInput").value.split('\n');
    } else if (source === "built-in") {
        contentInput = document.getElementById("contentInput").value;
        contents = [];
        fetch("/res/JLPT.csv")
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then(text => {
                let contents_all = text.split('\n');
                for (var i = 0; i < contents_all.length; i++) {
                    var line = contents_all[i];
                    if (line[line.length-1] === contentInput[1] || line[line.length-3] === contentInput[1]) {
                        contents.push(line);
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching file:', error);
            });
    } else if (source === "file") {
        const file = document.getElementById("contentInput").files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                contents = e.target.result.split('\n');
            };
            reader.readAsText(file);
        }
    }

    if (isNaN(interval) || interval <= 0 || isNaN(repeatCount) || repeatCount < 0) {
        alert("请设置好时间间隔和重复次数");
        document.getElementById("notificationToggle").checked = false;
        return;
    }

    let remainingRepeats = repeatCount;
    let i = -1;
    nextNotification.textContent = new Date(Date.now() + interval).toLocaleTimeString();

    notificationIntervalId = setInterval(() => {
        var title = "";
        var content = "";
        if (select_mode === "order") {
            i = (i+1)%contents.length;
        } else {
            i = Math.floor(Math.random()*contents.length);
        }
        content = contents[i];
        // alert(content);
        // 设置标题，按不同情况
        if (source === "built-in"){
            let content_split = content.split(",");
            title = content_split[0];
            let pre = '';
            let content1 = [];
            for (content_i in content_split) {
                // ［例］...
                let item = content_split[content_i];
                if (pre != '' && pre != title && (pre[0] != '［' || item[0] != '［' || pre.slice(0, 4) != item.slice(0, 4))) {
                    content1.push(pre);
                }
                pre = item;
            }
            content = content1.join();
        } else {
            title = "第"+(i+1)+"行";
        }
        const n = new Notification(title, { body:content, icon:"/images/ko.png", tag:"1", renotify:true});
        nextNotification.textContent = new Date(Date.now() + interval).toLocaleTimeString();
        if (remainingRepeats === 1) {stopNotificationCycle(); return;}
        if (remainingRepeats > 1) {remainingRepeats -= 1;}
    }, interval);
    const n = new Notification("开启成功", { body:'定时通知任务开启成功', icon:"/images/ko.png", tag:"1", renotify:true});
}

function stopNotificationCycle() {
    clearInterval(notificationIntervalId);
    document.getElementById("nextNotification").textContent = "--:--:--";
    document.getElementById("notificationToggle").checked = false;
}
