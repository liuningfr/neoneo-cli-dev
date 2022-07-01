'use strict';

const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const fse = require('fs-extra');
const semver = require('semver');
const ejs = require('ejs');
const glob = require('glob');
const Command = require('@neoneo-cli-dev/command');
const log = require('@neoneo-cli-dev/log');
const Package = require('@neoneo-cli-dev/package');
const { spinnerStart, sleep, execAsync } = require('@neoneo-cli-dev/utils');
const getProjectTemplate = require('./getProjectTemplate');

const TYPE_PROJECT = 'project';
const TYPE_COMPONENT = 'component';
const TEMPLATE_TYPE_NORMAL = 'normal';
const TEMPLATE_TYPE_CUSTOM = 'custom';
const WHITE_COMMAND = [ 'npm', 'cnpm' ];

let userHome;
class InitCommand extends Command {
    init() {
        this.projectName = this._argv[0] || '';
        this.force = this._argv[1].force;
        log.verbose('projectName', this.projectName);
        log.verbose('force', this.force);
    }

    async exec() {
        try {
            const projectInfo = await this.prepare();
            if (projectInfo) {
                log.verbose('projectInfo', JSON.stringify(projectInfo));
                this.projectInfo = projectInfo;
                await this.downloadTemplate();

                await this.installTemplate();
            }
        } catch (e) {
            log.error(e.message);
            if (process.env.LOG_LEVEL === 'verbose') {
                console.log(e);
            }
        }
    }

    async installTemplate() {
        if (this.templateInfo) {
            if (!this.templateInfo.type) {
                this.templateInfo.type = TEMPLATE_TYPE_NORMAL;
            }
            if (this.templateInfo.type === TEMPLATE_TYPE_NORMAL) {
                await this.installNormalTemplate();
            } else if (this.templateInfo.type === TEMPLATE_TYPE_CUSTOM) {
                await this.installCustomTemplate();
            } else {
                throw new Error('项目模板类型无法识别');
            }
        } else {
            throw new Error('项目模板信息不存在');
        }
    }

    checkCommand(cmd) {
        if (WHITE_COMMAND.includes(cmd)) {
            return cmd;
        }
        return null;
    }

    async execCommand(command, errMsg) {
        let ret;
        const cmdArray = command.split(' ');
        const cmd = this.checkCommand(cmdArray[0]);
        if  (!cmd) {
            throw new Error('命令不合法:' + command);
        }
        const args = cmdArray.splice(1);

        ret = await execAsync(cmd, args, {
            cwd: process.cwd(),
            stdio: 'inherit',
        });
        if (ret !== 0) {
            throw new Error(errMsg);
        }
        return ret;
    }

    ejsRender(options) {
        return new Promise((resolve, reject) => {
            const dir = process.cwd();
            glob('**', {
                cwd: dir,
                ignore: options.ignore || [],
                nodir: true,
            }, (err, files) => {
                if (err) {
                    reject(err);
                }
                Promise.all(files.map(file => {
                    const filePath = path.resolve(dir, file);
                    return new Promise((resolve1, reject1) => {
                        ejs.renderFile(filePath, {
                            className: this.projectInfo.className,
                            version: this.projectInfo.projectVersion,
                            description: this.projectInfo.componentDescription,
                        }, {}, (err, result) => {
                            if (err) {
                                reject1(err);
                            } else {
                                fse.writeFileSync(filePath, result);
                                resolve1(result);
                            }
                        });
                    });
                })).then(() => {
                    resolve();
                }).catch(err => {
                    reject(err);
                });
            });
        });
    }

    async installNormalTemplate () {
        const spinner = spinnerStart('正在安装模板...');
        await sleep();
        try {
            const templatePath = path.resolve(this.templateNpm.cacheFilePath, 'template');
            const targetPath = process.cwd();
            fse.ensureDirSync(templatePath);
            fse.ensureDirSync(targetPath);
            fse.copySync(templatePath, targetPath);
        } catch(e) {
            throw e;
        } finally {
            spinner.stop(true);
            log.verbose('templateNpm', JSON.stringify(this.templateNpm));
            log.success('模板安装成功');
        }
        const templateIgnore = this.templateInfo.ignore || [];
        const ignore = ['**/node_modules/**', ...templateIgnore];
        await this.ejsRender({
            ignore,
        });

        const { installCommand, startCommand } = this.templateInfo;
        await this.execCommand(installCommand, '依赖安装失败');
        await this.execCommand(startCommand, '启动命令失败');
    }

    async installCustomTemplate () {
        if (await this.templateNpm.exists()) {
            const rootFile = this.templateNpm.getRootFilePath();
            if (fs.existsSync(rootFile)) {
                log.notice('开始执行自定义模板');
                const options = {
                    ...this.templateInfo,
                    cwd: process.cwd(),
                };
                const code = `require('${rootFile}')(${JSON.stringify(options)})`;
                await execAsync('node', ['-e', code], {
                    cwd: process.cwd(),
                    stdio: 'inherit',
                });
                log.notice('自定义模板安装成功');
            } else {
                throw new Error('自定义模板入口文件不存在');
            }
        }
    }

    async downloadTemplate() {
        const { projectTemplate } = this.projectInfo;
        const templateInfo = this.template.find(item => item.npmName === projectTemplate);
        const { npmName, version } = templateInfo;
        this.templateInfo = templateInfo;

        userHome = require('os').homedir();
        const targetPath = path.resolve(userHome, '.neoneo-cli-dev', 'template');
        const storeDir = path.resolve(targetPath, 'node_modules');

        const templateNpm = new Package({
            targetPath,
            storeDir,
            packageName: npmName,
            packageVersion: version,
        });
        if (await templateNpm.exists()) {
            const spinner = spinnerStart('正在更新模板...');
            await sleep();
            await templateNpm.update();
            spinner.stop(true);
            log.success('更新模板成功');
            this.templateNpm = templateNpm;
        } else {
            const spinner = spinnerStart('正在下载模板...');
            await sleep();
            try {
                await templateNpm.install();
                log.success('下载模板成功');
                this.templateNpm = templateNpm;
            } catch (err) {
                throw(err);
            } finally {
                spinner.stop(true);
            }
        }
    }

    async prepare() {
        const template = await getProjectTemplate();
        if (!template || template.length === 0) {
            throw new Error('项目模板不存在');
        }
        this.template = template;
        // or path.resolve('.')
        const localPath = process.cwd();
        if (!this.isDirEmpty(localPath)) {
            let ifContinue = false;
            if (!this.force) {
                ifContinue = (await inquirer.prompt({
                    type: 'confirm',
                    name: 'ifContinue',
                    default: false,
                    message: '当前文件夹不为空，是否继续创建项目？'
                })).ifContinue;
                if (!ifContinue) {
                    return
                }
            }
            if (ifContinue || this.force) {
                const { confirmDelete } = await inquirer.prompt({
                    type: 'confirm',
                    name: 'confirmDelete',
                    default: false,
                    message: '确定要清空当前文件夹吗？'
                });
                if (confirmDelete) {
                    fse.emptyDirSync(localPath);
                }
            }
        }
        return await this.getProjectInfo();
    }

    async getProjectInfo() {
        function isValidName(v) {
            return /^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(v)
        }
        let projectInfo = {};
        let isProjectNameValid = false;
        if (isValidName(this.projectName)) {
            isProjectNameValid = true;
            projectInfo.projectName = this.projectName;
        }
        const { type } = await inquirer.prompt({
            type: 'list',
            name: 'type',
            default: TYPE_PROJECT,
            message: '请选择初始化类型',
            choices: [{
                name: '项目',
                value: TYPE_PROJECT,
            }, {
                name: '组件',
                value: TYPE_COMPONENT,
            }],
        });
        this.template = this.template.filter(item => item.tag.includes(type));

        const title = type === TYPE_PROJECT ? '项目' : '组件';
        const projectNamePrompt = {
            type: 'input',
            name: 'projectName',
            message: `请输入${title}名称`,
            default: '',
            validate: function (v) {
                const done = this.async();
                setTimeout(function() {
                if (!isValidName(v)) {
                    done(`请输入合法的${title}名称`);
                    return;
                }
                done(null, true);
                }, 0);
            },
            filter: (v) => {
                return v;
            },
        };
        const projectPrompt = [];
        if (!isProjectNameValid) {
            projectPrompt.push(projectNamePrompt);
        }
        projectPrompt.push({
            type: 'input',
            name: 'projectVersion',
            message: `请输入${title}版本号`,
            default: '1.0.0',
            validate: function (v) {
                const done = this.async();
                setTimeout(function() {
                if (!semver.valid(v)) {
                    done('请输入合法的版本号');
                    return;
                }
                done(null, true);
                }, 0);
            },
            filter: (v) => {
                if (!!semver.valid(v)) {
                    return semver.valid(v);
                } else {
                    return v;
                }
            },
        }, {
            type: 'list',
            name: 'projectTemplate',
            message: `请选择${title}模板`,
            choices: this.createTemplateChoice(),
        });
        if (type === TYPE_PROJECT) {
            const project = await inquirer.prompt(projectPrompt);
            projectInfo = {
                ...projectInfo,
                type,
                ...project,
            };
        } else if (type === TYPE_COMPONENT) {
            const descriptionPrompt = {
                type: 'input',
                name: 'componentDescription',
                message: '请输入组件描述',
                default: '',
                validate: function (v) {
                    const done = this.async();
                    setTimeout(function() {
                    if (!v) {
                        done('请输入组件描述');
                        return;
                    }
                    done(null, true);
                    }, 0);
                },
            };
            projectPrompt.push(descriptionPrompt);
            const project = await inquirer.prompt(projectPrompt);
            projectInfo = {
                ...projectInfo,
                type,
                ...project,
            };
        }
        if (projectInfo.projectName) {
            projectInfo.className = require('kebab-case')(projectInfo.projectName).replace(/^-/, '');
        }
        return projectInfo;
    }

    isDirEmpty(localPath) {
        let fileList = fs.readdirSync(localPath);
        fileList = fileList.filter((file) => (
            !file.startsWith('.') && ['node_modules'].indexOf(file) < 0
        ));
        return !fileList || fileList.length === 0;
    }

    createTemplateChoice() {
        return this.template.map(item => ({
            name: item.name,
            value: item.npmName,
        }));
    }
}

function init(argv) {
    return new InitCommand(argv);
}

module.exports = init;
module.exports.InitCommand = InitCommand;
