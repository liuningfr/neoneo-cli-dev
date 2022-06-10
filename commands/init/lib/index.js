'use strict';

const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const fse = require('fs-extra');
const semver = require('semver');
const Command = require('@neoneo-cli-dev/command');
const log = require('@neoneo-cli-dev/log');
const Package = require('@neoneo-cli-dev/package');
const { spinnerStart, sleep } = require('@neoneo-cli-dev/utils');
const getProjectTemplate = require('./getProjectTemplate');

const TYPE_PROJECT = 'project';
const TYPE_COMPONENT = 'component';

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
                console.log('projectInfo', projectInfo);
                this.projectInfo = projectInfo;
                await this.downloadTemplate();
            }
        } catch (e) {
           log.error(e.message); 
        }
    }

    async downloadTemplate() {
        const { projectTemplate } = this.projectInfo;
        const { npmName, version } = this.template.find(item => item.npmName === projectTemplate);

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
        } else {
            const spinner = spinnerStart('正在下载模板...');
            await sleep();
            try {
                await templateNpm.install();
                log.success('下载模板成功');
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
        let projectInfo = {};

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
        log.verbose(type);
        
        if (type === TYPE_PROJECT) {
            const project = await inquirer.prompt([{
                type: 'input',
                name: 'projectName',
                message: '请输入项目名称',
                default: '',
                validate: function (v) {
                    const done = this.async();
                    setTimeout(function() {
                    if (!/^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(v)) {
                        done('请输入合法的项目名称');
                        return;
                    }
                    done(null, true);
                    }, 0);
                },
                filter: (v) => {
                    return v;
                },
            }, {
                type: 'input',
                name: 'projectVersion',
                message: '请输入项目版本号',
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
                message: '请选择项目模板',
                choices: this.createTemplateChoice(),
            }]);
            projectInfo = {
                type,
                ...project,
            };
        } else if (type === TYPE_COMPONENT) {

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
