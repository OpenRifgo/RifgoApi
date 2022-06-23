import App from '../../App';
const ejs = require('ejs');

export abstract class EmailTemplateAbstractRenderer {
  protected app: App;

  constructor(app: App) {
    this.app = app;
  }
}

export class EmailTemplateLayoutRenderer extends EmailTemplateAbstractRenderer {

  async render(data: {
    content: string,
    styles?: string,
    topic?: string,
    siteAddress?: string,
    siteDisplayName?: string,
  }) {
    return await ejs.renderFile(
      `${this.app.dirService.rootDir}/src/templates/mail/builder/defaultLayout.html.ejs`,
      {
        styles: '',
        topic: '',
        siteAddress: '',
        siteDisplayName: '',
        ...data
      },
      {async: true},
    )
  }

}

export class EmailTemplateBuilder {
  protected app: App;

  constructor(app: App) {
    this.app = app;
  }

  render(data: {
    content: string,
    topic?: string,
    styles?: string,
    siteAddress?: string,
    siteDisplayName?: string,
  }) {
    return new EmailTemplateLayoutRenderer(this.app)
      .render({
        ...data,
      });
  }

}

export class EmailTemplateBuilderFactory {
  protected app: App

  constructor(app: App) {
    this.app = app
  }

  build() {
    return new EmailTemplateBuilder(this.app);
  }
}
