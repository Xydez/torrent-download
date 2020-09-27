import WebTorrent from "webtorrent";
import chalk from "chalk";
import path from "path";
import promptSync from "prompt-sync";
import axios from "axios";

const extensions = ["mp4", "m4p", "m4v", "mov", "wmv", "flv", "swf", "avi", "webm", "mkv", "ogg", "avchd"];

function repeat(seq: string, count: number): string {
    let ret = "";

    for (let i = 0; i < count; i++) {
        ret += seq;
    }

    return ret;
}

function formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

async function getPastebin(code: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        process.stdout.write("Fetching content from pastebin...\n");

        axios.get(`http://pastebin.com/raw/${code}`)
            .then(response => {
                process.stdout.write("Done.\n");
                resolve(response.data);
            });
    });
}

async function main() {
    const client = new WebTorrent();
    const prompt = promptSync();
    
    let magnet: string;
    
    if (process.argv.length > 2) {
        magnet = await getPastebin(process.argv.slice(2).join(" "));
    } else {
        let code = prompt(chalk.green("What is your torrent code? "));
        magnet = await getPastebin(code);
    }
    
    process.stdout.write(`Downloading magnet link:\n${magnet}\n`);
    
    client.add(magnet, { path: path.resolve("downloads") }, (torrent: WebTorrent.Torrent) => {
        process.stdout.write(chalk.green(`Downloading torrent "${torrent.name}" with infoHash ${torrent.infoHash}\n`));
    
        let interval = setInterval(() => {
            const time = new Date(torrent.timeRemaining);
            process.stdout.write(`\rProgress: [${repeat("=", Math.round(torrent.progress * 20)) + repeat(" ", 20 - Math.round(torrent.progress * 20))}] ${Math.round(torrent.progress * 1000) / 10}% (${formatBytes(torrent.downloaded)} / ${formatBytes(torrent.length)})    Time remaining: ${time.getUTCHours().toString().padStart(2, "0")}:${time.getUTCMinutes().toString().padStart(2, "0")}:${time.getUTCSeconds().toString().padStart(2, "0")}     `);
        }, 1000 / 10);
    
        torrent.on("done", () => {
            clearInterval(interval);
    
            const video = torrent.files.find(value => {
                for (const extension of extensions) {
                    if (value.name.endsWith("." + extension)) {
                        return true;
                    }
                }
    
                return false;
            });
            
            client.destroy(() => process.stdout.write(chalk.green("\nDone\n")));
        });
    });
}

main();
